const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const crypto  = require('crypto');
const cors    = require('cors');
const { createClerkClient, verifyToken } = require('@clerk/backend');
const db = require('./db');

const app = express();

// Prevent process crashes on uncaught exceptions or promise rejections
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
});

// HTML Input Sanitization helper to prevent Cross-Site Scripting (XSS)
function sanitizeInput(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Production-safe error responder to prevent leakage of internal/db errors
function sendError(res, err, friendlyMessage = 'An internal server error occurred.', statusCode = 500) {
  console.error('❌ Server Error Details:', err);
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(statusCode).json({
    error: friendlyMessage,
    ...(isProd ? {} : { details: err.message })
  });
}

// ── CORS: allow both the Vite storefront and Next.js admin ──────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// ── Content-Security-Policy (CSP) Middleware ────────────────────────────────
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.clerk.accounts.dev; " +
    "connect-src 'self' https://*.clerk.accounts.dev https://api.razorpay.com http://localhost:5000 ws://localhost:5173 ws://localhost:3000; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https://*.unsplash.com https://img.clerk.com https://images.unsplash.com; " +
    "frame-src 'self' https://checkout.razorpay.com;"
  );
  next();
});

// ── HTTPS Enforcement Middleware (Production only) ───────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy'); // Trust headers set by reverse proxies (Render, Heroku, AWS)
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Raw body for Clerk webhook signature verification
app.use('/api/clerk-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Admin email whitelist ────────────────────────────────────────────────────
const ADMIN_EMAILS = ['vikaselle196@gmail.com', 'yashwantreddy231@gmail.com'];

// Initialize user_logins database migration
async function initDB() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_logins (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        clerk_id   VARCHAR(255) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        name       VARCHAR(255),
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ MySQL user_logins table verified');
  } catch (err) {
    console.error('❌ Database migration error:', err);
  }
}
initDB();

// ── Clerk client ─────────────────────────────────────────────────────────────
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// ── Razorpay setup ───────────────────────────────────────────────────────────
const missingRazorpayConfig = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'].filter(k => !process.env[k]);
if (missingRazorpayConfig.length > 0) {
  console.warn(`Razorpay env vars missing: ${missingRazorpayConfig.join(', ')}`);
}

async function createRazorpayOrder(amount) {
  try {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount, currency: 'INR', receipt: `receipt_${Date.now()}` }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.description || `Razorpay failed ${response.status}`);
    return data;
  } catch (error) {
    if (process.env.RAZORPAY_MOCK_MODE === 'true' || process.env.NODE_ENV !== 'production') {
      return { id: `mock_order_${Date.now()}`, amount, currency: 'INR', mockMode: true };
    }
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  MIDDLEWARE — Verify Clerk session + require admin email
// ════════════════════════════════════════════════════════════════════════════
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      console.warn('⚠️ requireAdmin: Missing Authorization token header.');
      return res.status(401).json({ error: 'No auth token' });
    }

    // Verify token validity with Clerk
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const clerkId = payload.sub;

    // Check DB first to avoid sluggish internet calls to Clerk API
    const [users] = await db.execute('SELECT email, role FROM users WHERE clerk_id = ?', [clerkId]);

    let email = '';
    let role = '';

    if (users.length > 0) {
      email = users[0].email;
      role = users[0].role;
    } else {
      // If user isn't in MySQL yet, fetch profile from Clerk
      console.log(`ℹ️ Clerk ID ${clerkId} not in local database. Fetching profile from Clerk...`);
      try {
        const clerkUser = await clerk.users.getUser(clerkId);
        email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
        role = ADMIN_EMAILS.includes(email) ? 'admin' : 'customer';

        // Auto-cache user in local DB
        await db.execute(
          `INSERT INTO users (clerk_id, email, name, role) VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE clerk_id=VALUES(clerk_id), role=VALUES(role)`,
          [clerkId, email, clerkUser.firstName || email.split('@')[0], role]
        );
      } catch (clerkErr) {
        console.error('❌ Failed fetching user details from Clerk API:', clerkErr.message);
      }
    }

    if (!ADMIN_EMAILS.includes(email)) {
      console.warn(`❌ requireAdmin: Access denied for user ${email || clerkId} (role: ${role})`);
      return res.status(403).json({ error: 'Access denied — admin only' });
    }

    req.adminEmail  = email;
    req.adminClerkId = clerkId;
    next();
  } catch (err) {
    return sendError(res, err, 'Invalid or expired token', 401);
  }
}

// ── Audit log helper ─────────────────────────────────────────────────────────
async function auditLog(req, action, table, targetId, details = {}) {
  try {
    await db.execute(
      'INSERT INTO audit_log (admin_clerk_id, admin_email, action, target_table, target_id, details) VALUES (?,?,?,?,?,?)',
      [req.adminClerkId, req.adminEmail, action, table, String(targetId), JSON.stringify(details)]
    );
  } catch (_) {}
}

// ════════════════════════════════════════════════════════════════════════════
//  CLERK WEBHOOK — auto-sync new users to MySQL
// ════════════════════════════════════════════════════════════════════════════
app.post('/api/clerk-webhook', async (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString());
    const { type, data } = payload;

    if (type === 'user.created' || type === 'user.updated') {
      const clerkId = data.id;
      const email   = data.email_addresses?.[0]?.email_address || '';
      const name    = [data.first_name, data.last_name].filter(Boolean).join(' ') || email.split('@')[0];
      const role    = ADMIN_EMAILS.includes(email) ? 'admin' : 'customer';

      // ON DUPLICATE KEY UPDATE must map clerk_id to support updating seeded placeholder IDs
      await db.execute(
        `INSERT INTO users (clerk_id, email, name, role) VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE clerk_id=VALUES(clerk_id), name=VALUES(name), role=VALUES(role)`,
        [clerkId, email, name, role]
      );
      console.log(`✅ Webhook: Synced user ${email} (clerkId: ${clerkId}, role: ${role})`);
    }

    if (type === 'session.created') {
      const clerkId = data.user_id;
      await db.execute('UPDATE users SET last_login = NOW() WHERE clerk_id = ?', [clerkId]);
    }

    res.json({ received: true });
  } catch (err) {
    return sendError(res, err, 'Webhook payload processing failed', 400);
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES — Storefront
// ════════════════════════════════════════════════════════════════════════════

// Get all products from database
app.post('/api/users/sync-login', async (req, res) => {
  try {
    const { clerkId, email: rawEmail, name: rawName } = req.body;
    if (!clerkId || !rawEmail) {
      return res.status(400).json({ error: 'Missing clerkId or email' });
    }
    const email = sanitizeInput(rawEmail);
    const name = sanitizeInput(rawName);
    const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'customer';
    
    // Check if user already exists
    const [existing] = await db.execute('SELECT id, role FROM users WHERE clerk_id = ? OR email = ?', [clerkId, email]);
    
    if (existing.length > 0) {
      // Update existing record, setting last_login = NOW()
      await db.execute(
        'UPDATE users SET clerk_id = ?, email = ?, name = COALESCE(?, name), last_login = NOW() WHERE id = ?',
        [clerkId, email, name || null, existing[0].id]
      );
      console.log(`✅ Real-time login synced: ${email} (clerkId: ${clerkId}, role: ${existing[0].role})`);
    } else {
      // Insert new customer record with last_login = NOW()
      await db.execute(
        'INSERT INTO users (clerk_id, email, name, role, last_login) VALUES (?,?,?,?, NOW())',
        [clerkId, email, name || null, role]
      );
      console.log(`🌱 Real-time user created & login synced: ${email} (clerkId: ${clerkId}, role: ${role})`);
    }

    // Insert historical login record for "each and every time of login" tracking
    await db.execute(
      'INSERT INTO user_logins (clerk_id, email, name) VALUES (?,?,?)',
      [clerkId, email, name || null]
    );
    console.log(`📝 Logged login event: ${email} at ${new Date().toISOString()}`);
    
    res.json({ success: true });
  } catch (err) {
    return sendError(res, err, 'Failed to sync user login session');
  }
});

// Get all products from database
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products ORDER BY id ASC');
    // Map JSON fields back to arrays
    const mapped = rows.map(r => ({
      ...r,
      sizes: typeof r.sizes === 'string' ? JSON.parse(r.sizes) : (r.sizes || []),
      colors: typeof r.colors === 'string' ? JSON.parse(r.colors) : (r.colors || []),
      inStock: Boolean(r.in_stock),
      originalPrice: r.original_price
    }));
    res.json(mapped);
  } catch (err) {
    return sendError(res, err, 'Failed to fetch products');
  }
});

// Seed products from client if database is empty
app.post('/api/products/seed', async (req, res) => {
  try {
    const [check] = await db.execute('SELECT COUNT(*) AS count FROM products');
    if (check[0].count > 0) {
      return res.json({ success: true, message: 'Database already has products' });
    }

    const { products: clientProducts } = req.body;
    if (!clientProducts || !Array.isArray(clientProducts)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    console.log(`🌱 Seeding ${clientProducts.length} products from client into MySQL...`);
    for (const p of clientProducts) {
      await db.execute(
        `INSERT INTO products (id, name, category, price, original_price, image, badge, in_stock, rating, reviews, description, sizes, colors)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          p.id,
          p.name,
          p.category,
          p.price,
          p.originalPrice || null,
          p.image,
          p.badge || null,
          p.inStock !== false,
          p.rating || 0,
          p.reviews || 0,
          p.description || 'Premium quality apparel from Sai Deepthi.',
          JSON.stringify(p.sizes || ["XS", "S", "M", "L", "XL", "XXL"]),
          JSON.stringify(p.colors || ["Black"])
        ]
      );
    }
    res.json({ success: true, seededCount: clientProducts.length });
  } catch (err) {
    return sendError(res, err, 'Product database seeding failed');
  }
});

// Save order from storefront checkout
app.post('/api/orders', async (req, res) => {
  try {
    const { clerkId, customerEmail: rawEmail, customerName: rawName, items, totalAmount, shippingAmount, shippingAddress, paymentMethod, razorpayOrderId, razorpayPaymentId } = req.body;

    const customerEmail = sanitizeInput(rawEmail);
    const customerName = sanitizeInput(rawName);

    // Sanitize shipping address string values
    const cleanAddress = {};
    if (shippingAddress && typeof shippingAddress === 'object') {
      Object.keys(shippingAddress).forEach(key => {
        cleanAddress[key] = sanitizeInput(shippingAddress[key]);
      });
    }

    const [orderResult] = await db.execute(
      `INSERT INTO orders (clerk_id, customer_email, customer_name, total_amount, shipping_amount, status, shipping_address)
       VALUES (?,?,?,?,?,?,?)`,
      [clerkId || null, customerEmail, customerName, totalAmount, shippingAmount || 0, 'confirmed', JSON.stringify(cleanAddress)]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    if (items && items.length > 0) {
      for (const item of items) {
        await db.execute(
          'INSERT INTO order_items (order_id, product_name, quantity, unit_price) VALUES (?,?,?,?)',
          [orderId, sanitizeInput(item.name), item.quantity, item.price || item.salePrice || 0]
        );
      }
    }

    // Insert payment record
    await db.execute(
      `INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, amount, status, method)
       VALUES (?,?,?,?,?,?)`,
      [orderId, razorpayOrderId || null, razorpayPaymentId || null, totalAmount, 'success', paymentMethod || 'unknown']
    );

    res.json({ success: true, orderId });
  } catch (err) {
    return sendError(res, err, 'Failed to save checkout order');
  }
});

// Razorpay — Create Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
      return res.status(500).json({ error: 'Razorpay credentials not configured.' });
    if (!amount || amount < 100)
      return res.status(400).json({ error: 'Amount must be >= 100 paise' });
    const order = await createRazorpayOrder(amount);
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency, mockMode: Boolean(order.mockMode) });
  } catch (err) {
    return sendError(res, err, 'Razorpay order creation failed');
  }
});

// Razorpay — Verify Payment
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (razorpay_order_id?.startsWith('mock_order_')) return res.json({ success: true, mockMode: true });
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return res.status(400).json({ error: 'Missing fields' });
  const generated = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
  return generated === razorpay_signature
    ? res.json({ success: true })
    : res.status(400).json({ error: 'Signature mismatch' });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES — All protected by requireAdmin middleware
// ════════════════════════════════════════════════════════════════════════════

// ── Stats overview ───────────────────────────────────────────────────────────
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [[{ userCount }]]    = await db.execute('SELECT COUNT(*) AS userCount FROM users');
    const [[{ orderCount }]]   = await db.execute('SELECT COUNT(*) AS orderCount FROM orders');
    const [[{ revenue }]]      = await db.execute('SELECT COALESCE(SUM(amount),0) AS revenue FROM payments WHERE status="success"');
    const [[{ productCount }]] = await db.execute('SELECT COUNT(*) AS productCount FROM products');
    
    const [dailyRevenue] = await db.execute(
      `SELECT DATE(created_at) AS date, SUM(amount) AS total
       FROM payments WHERE status='success' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) ORDER BY date ASC`
    );
    const [recentLogins] = await db.execute(
      `SELECT name, email, login_time AS last_login
       FROM user_logins
       ORDER BY login_time DESC
       LIMIT 15`
    );

    res.json({ userCount, orderCount, revenue, productCount, dailyRevenue, recentLogins });
  } catch (err) { return sendError(res, err, 'Failed to fetch admin stats'); }
});

// ── Users ────────────────────────────────────────────────────────────────────
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM users ORDER BY created_at DESC');
  res.json(rows);
});

app.patch('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin','customer','tester'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    await db.execute('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
    await auditLog(req, 'UPDATE_ROLE', 'users', req.params.id, { newRole: role });
    res.json({ success: true });
  } catch (err) { return sendError(res, err, 'Failed to update user role'); }
});

// ── Products ─────────────────────────────────────────────────────────────────
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name: rawName, category: rawCategory, price, original_price, image, badge: rawBadge, in_stock, description: rawDescription, sizes, colors } = req.body;
    const name = sanitizeInput(rawName);
    const category = sanitizeInput(rawCategory);
    const badge = sanitizeInput(rawBadge);
    const description = sanitizeInput(rawDescription);

    const [result] = await db.execute(
      `INSERT INTO products (name, category, price, original_price, image, badge, in_stock, description, sizes, colors)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        name,
        category,
        price,
        original_price || null,
        image,
        badge || null,
        in_stock !== false,
        description || 'Premium quality apparel from Sai Deepthi.',
        JSON.stringify(sizes || ["XS", "S", "M", "L", "XL", "XXL"]),
        JSON.stringify(colors || ["Black"])
      ]
    );
    await auditLog(req, 'CREATE_PRODUCT', 'products', result.insertId, { name });
    res.json({ success: true, id: result.insertId });
  } catch (err) { return sendError(res, err, 'Failed to create new product'); }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { name: rawName, category: rawCategory, price, original_price, image, badge: rawBadge, in_stock, description: rawDescription, sizes, colors } = req.body;
    const name = sanitizeInput(rawName);
    const category = sanitizeInput(rawCategory);
    const badge = sanitizeInput(rawBadge);
    const description = sanitizeInput(rawDescription);

    await db.execute(
      `UPDATE products
       SET name=?, category=?, price=?, original_price=?, image=?, badge=?, in_stock=?, description=?, sizes=?, colors=?
       WHERE id=?`,
      [
        name,
        category,
        price,
        original_price || null,
        image,
        badge || null,
        in_stock !== false,
        description || 'Premium quality apparel from Sai Deepthi.',
        JSON.stringify(sizes || ["XS", "S", "M", "L", "XL", "XXL"]),
        JSON.stringify(colors || ["Black"]),
        req.params.id
      ]
    );
    await auditLog(req, 'UPDATE_PRODUCT', 'products', req.params.id, { name });
    res.json({ success: true });
  } catch (err) { return sendError(res, err, 'Failed to update product details'); }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE id=?', [req.params.id]);
    await auditLog(req, 'DELETE_PRODUCT', 'products', req.params.id, {});
    res.json({ success: true });
  } catch (err) { return sendError(res, err, 'Failed to delete product'); }
});

// ── Orders ───────────────────────────────────────────────────────────────────
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  const [rows] = await db.execute(
    `SELECT o.*, GROUP_CONCAT(CONCAT(oi.quantity,'x ',oi.product_name) SEPARATOR ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
     GROUP BY o.id ORDER BY o.created_at DESC`
  );
  res.json(rows);
});

app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
    await auditLog(req, 'UPDATE_ORDER_STATUS', 'orders', req.params.id, { status });
    res.json({ success: true });
  } catch (err) { return sendError(res, err, 'Failed to update order status'); }
});

// ── Payments ─────────────────────────────────────────────────────────────────
app.get('/api/admin/payments', requireAdmin, async (req, res) => {
  const [rows] = await db.execute(
    `SELECT p.*, o.customer_email, o.customer_name
     FROM payments p LEFT JOIN orders o ON o.id=p.order_id
     ORDER BY p.created_at DESC`
  );
  res.json(rows);
});

// ── Audit Log ─────────────────────────────────────────────────────────────────
app.get('/api/admin/audit', requireAdmin, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100');
  res.json(rows);
});

// ════════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
