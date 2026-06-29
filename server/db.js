const mysql = require('mysql2/promise');

let pool;

function createResilientPool() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '#Mysql@2026!1',
    database: process.env.DB_NAME || 'e_commerce_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // Sends TCP keep-alive packets every 10s to keep connection active
  };

  const newPool = mysql.createPool(dbConfig);

  // Monitor connection errors on the pool level to prevent the node process from crashing
  newPool.on('connection', (connection) => {
    connection.on('error', (err) => {
      console.error('⚠️ Database connection error occurred:', err.code);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log('🔄 Connection lost. The pool will recycle connections automatically.');
      }
    });
  });

  return newPool;
}

// Singleton pattern to reuse connection pools across Serverless/Vercel hot-reloads
if (!global._mysqlPool) {
  global._mysqlPool = createResilientPool();
}
pool = global._mysqlPool;

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected to e_commerce_db');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed on startup:', err.message);
  });

// Resilient query wrapper with auto-retry on connection drop
async function executeQuery(sql, params = []) {
  try {
    return await pool.execute(sql, params);
  } catch (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.fatal) {
      console.warn('🔄 Database connection lost during query execution. Retrying once...');
      try {
        // Recycle pool if it died
        global._mysqlPool = createResilientPool();
        pool = global._mysqlPool;
        return await pool.execute(sql, params);
      } catch (retryErr) {
        console.error('❌ Database query retry failed:', retryErr.message);
        throw retryErr;
      }
    }
    throw err;
  }
}

module.exports = {
  execute: executeQuery,
  getConnection: () => pool.getConnection(),
  query: (sql, params) => pool.query(sql, params),
  pool,
};
