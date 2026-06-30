import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Lock, Truck, CreditCard, ShieldCheck, ChevronRight, QrCode, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import { useUser } from '@clerk/react';
import { API_BASE_URL } from '../config';

const steps = ['Shipping', 'Payment', 'Review'];

export default function CheckoutPage() {
  const { user } = useUser();
  const { cartItems, cartTotal, cartCount, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const shipping = cartTotal >= 999 ? 0 : 99;
  const finalTotal = cartTotal + shipping;

  const [shippingData, setShippingData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const handleShippingChange = e => setShippingData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleCardChange = e => setCardData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePlaceOrder = async () => {
    const orderPayload = {
      clerkId: user?.id || null,
      customerEmail: shippingData.email || user?.primaryEmailAddress?.emailAddress || '',
      customerName: `${shippingData.firstName} ${shippingData.lastName}`.trim() || user?.fullName || 'Guest User',
      items: cartItems,
      totalAmount: cartTotal,
      shippingAmount: shipping,
      shippingAddress: {
        address: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        pincode: shippingData.pincode,
        phone: shippingData.phone
      },
      paymentMethod
    };

    if (paymentMethod === 'card' || paymentMethod === 'upi') {
      try {
        const orderRes = await fetch(`${API_BASE_URL}/api/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Math.round(finalTotal * 100) })
        });
        
        const orderData = await orderRes.json();
        if (orderData.error) throw new Error(orderData.error);
 
        // If backend returned a mock order, skip real checkout modal
        if (orderData.mockMode) {
          await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...orderPayload,
              razorpayOrderId: orderData.order_id,
              razorpayPaymentId: `mock_payment_${Date.now()}`
            })
          });
          clearCart();
          setOrderPlaced(true);
          return;
        }
 
        // Open Razorpay Checkout modal
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T5jwPnNSv9l1bs',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: "Sai Deepthi Dresses",
          description: "E-Commerce Purchase Checkout",
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              // 1. Verify payment signature on backend
              const verifyRes = await fetch(`${API_BASE_URL}/api/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (!verifyData.success) {
                throw new Error(verifyData.error || "Payment signature verification failed");
              }
 
              // 2. Save order to database
              await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...orderPayload,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id
                })
              });
 
              clearCart();
              setOrderPlaced(true);
            } catch (err) {
              console.error("Signature Verification / Order Save Error:", err);
              alert("Payment verification failed: " + err.message);
            }
          },
          prefill: {
            name: `${shippingData.firstName} ${shippingData.lastName}`,
            email: shippingData.email,
            contact: shippingData.phone,
          },
          theme: {
            color: "#0D9488",
          }
        };
 
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
 
      } catch (err) {
        console.error("Payment Order Error:", err);
        alert("Failed to initiate payment: " + err.message);
      }
    } else {
      // Cash on delivery or other
      try {
        await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        clearCart();
        setOrderPlaced(true);
      } catch (err) {
        console.error("Order Save Error:", err);
      }
    }
  };


  const [shippingErrors, setShippingErrors] = useState({});

  const handleShippingSubmit = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    const errors = {};
    required.forEach(field => {
      if (!shippingData[field].trim()) errors[field] = 'Required';
    });
    if (Object.keys(errors).length > 0) {
      setShippingErrors(errors);
      return;
    }
    setShippingErrors({});
    setStep(1);
  };

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#F5F0EB] via-white to-[#EDE5DC]/40 pt-32 pb-20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4 py-12 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl">
            <h1 className="font-heqra text-3xl font-semibold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="font-outfit text-gray-500 font-light mb-8">Add some items to your cart before checking out.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-ink-black px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-rust transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Browse Collection
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (orderPlaced) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#F5F0EB] via-white to-[#EDE5DC]/40 pt-32 pb-20 flex items-center justify-center">
          <div className="text-center max-w-lg mx-auto px-6 py-12 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl">
            <div className="flex justify-center mb-6">
              <CheckCircle size={72} className="text-green-500 animate-bounce" strokeWidth={1.5} />
            </div>
            <h1 className="font-heqra text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
            <p className="font-outfit text-gray-500 font-light mb-2">Thank you for shopping with Sai Deepthi.</p>
            <p className="font-outfit text-gray-500 font-light mb-8 text-sm">
              Your order has been placed successfully. You'll receive a confirmation email shortly.
            </p>
            <div className="bg-white/80 rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 text-left max-w-sm mx-auto">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Order Number</p>
              <p className="font-heqra text-xl font-bold text-ink-black">
                #SD{Date.now().toString().slice(-8)}
              </p>
              <div className="h-px bg-gray-100 my-4" />
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Estimated Delivery</p>
              <p className="font-outfit font-medium text-gray-800">5–7 Business Days</p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-ink-black px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-rust transition-all duration-300 shadow-md"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#F5F0EB] via-white to-[#EDE5DC]/40 pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2.5">
            <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <Link to="/cart" className="hover:text-gray-900 transition-colors">Cart</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Checkout</span>
          </nav>

          <h1 className="font-heqra text-4xl md:text-5xl font-bold text-gray-900 mb-8 tracking-tight">Checkout</h1>

          {/* Step indicator */}
          <div className="flex items-center justify-start gap-4 mb-10 sm:gap-6">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < step 
                      ? 'bg-green-500 text-white shadow-md' 
                      : i === step 
                        ? 'bg-ink-black text-white ring-4 ring-rust/20 shadow-md' 
                        : 'bg-white text-gray-400 border border-gray-200 shadow-sm'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`font-outfit text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                    i <= step ? 'text-ink-black' : 'text-gray-400'
                  }`}>
                    {s}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-[2px] w-6 sm:w-12 mx-1 sm:mx-3 transition-colors duration-300 ${
                    i < step ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Main Form */}
            <div className="lg:col-span-2 overflow-hidden">
              <AnimatePresence mode="wait">
                {/* Step 0: Shipping */}
                {step === 0 && (
                  <motion.div
                    key="step-shipping"
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -30, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 sm:p-8"
                  >
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                      <Truck size={20} className="text-rust" />
                      <h2 className="font-heqra text-xl font-bold text-gray-900">Shipping Information</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { name: 'firstName', label: 'First Name', type: 'text', full: false },
                        { name: 'lastName', label: 'Last Name', type: 'text', full: false },
                        { name: 'email', label: 'Email Address', type: 'email', full: true },
                        { name: 'phone', label: 'Phone Number', type: 'tel', full: false },
                        { name: 'address', label: 'Street Address', type: 'text', full: true },
                        { name: 'city', label: 'City', type: 'text', full: false },
                        { name: 'state', label: 'State', type: 'text', full: false },
                        { name: 'pincode', label: 'PIN Code', type: 'text', full: false },
                      ].map(field => (
                        <div key={field.name} className={field.full ? 'sm:col-span-2' : ''}>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 pl-1">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            name={field.name}
                            value={shippingData[field.name]}
                            onChange={handleShippingChange}
                            required
                            className={`w-full rounded-xl border bg-white/80 py-3 px-4 text-sm text-gray-900 outline-none transition-all duration-300 ${
                              shippingErrors[field.name]
                                ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                : 'border-gray-200 focus:border-rust focus:ring-2 focus:ring-rust/10'
                            }`}
                          />
                          {shippingErrors[field.name] && (
                            <p className="text-xs text-red-500 mt-1 pl-1">{shippingErrors[field.name]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleShippingSubmit}
                      className="mt-8 w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-ink-black px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-rust transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Continue to Payment
                    </button>
                  </motion.div>
                )}

                {/* Step 1: Payment */}
                {step === 1 && (
                  <motion.div
                    key="step-payment"
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -30, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 sm:p-8"
                  >
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                      <CreditCard size={20} className="text-rust" />
                      <h2 className="font-heqra text-xl font-bold text-gray-900">Payment Method</h2>
                    </div>

                    {/* Method Selector */}
                    <div className="flex flex-col gap-4 mb-8">
                      {[
                        { 
                          key: 'card', 
                          label: 'Card', 
                          Icon: ({ className }) => <CreditCard className={className} size={20} strokeWidth={1.8} /> 
                        },
                        { 
                          key: 'upi', 
                          label: 'UPI', 
                          Icon: ({ className }) => (
                            <div className="flex items-center">
                              {/* Simple customized double chevron to resemble UPI logo */}
                              <ChevronRight className={`${className} -mr-2`} size={20} strokeWidth={2.5} />
                              <ChevronRight className={className} size={20} strokeWidth={2.5} />
                            </div>
                          )
                        },
                        { 
                          key: 'cod', 
                          label: 'Cash on Delivery', 
                          Icon: ({ className }) => <Banknote className={className} size={20} strokeWidth={1.8} /> 
                        }
                      ].map(m => (
                        <button
                          key={m.key}
                          onClick={() => setPaymentMethod(m.key)}
                          className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                            paymentMethod === m.key
                              ? 'border-[#2563EB] bg-[#EFF6FF]/60 ring-2 ring-[#2563EB]/10'
                              : 'border-gray-200 bg-white/50 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center shrink-0">
                              <m.Icon className={paymentMethod === m.key ? 'text-[#2563EB]' : 'text-gray-400'} />
                            </div>
                            <span className="font-outfit font-bold text-base text-gray-900">{m.label}</span>
                          </div>
                          <ChevronRight className={paymentMethod === m.key ? 'text-[#2563EB]' : 'text-gray-400'} size={20} />
                        </button>
                      ))}
                    </div>

                    <div className="bg-white/90 border border-gray-100 rounded-2xl p-5 mb-8">
                      {paymentMethod === 'card' && (
                        <p className="text-sm text-gray-500 font-light leading-relaxed">
                          You will be securely redirected to our verified payment partner **Razorpay** to complete your credit/debit card transactions.
                        </p>
                      )}

                      {paymentMethod === 'upi' && (
                        <p className="text-sm text-gray-500 font-light leading-relaxed">
                          Authorize UPI payment immediately through your phone GPay, PhonePe, Paytm, or BHIM apps via Razorpay.
                        </p>
                      )}

                      {paymentMethod === 'cod' && (
                        <p className="text-sm text-gray-500 font-light leading-relaxed">
                          Pay with cash upon delivery. An additional cash handling charge of **₹50** COD fee will be applied to your final invoice.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => setStep(0)}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ink-black py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-rust transition-all duration-300 shadow-md cursor-pointer"
                      >
                        Review Order
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                  <motion.div
                    key="step-review"
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -30, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 sm:p-8"
                  >
                    <h2 className="font-heqra text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Review Your Order</h2>

                    <ul className="divide-y divide-gray-100 mb-6">
                      {cartItems.map(item => (
                        <li key={item.id} className="flex items-center gap-4 py-4">
                          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-150 shadow-sm bg-gray-50">
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            ₹{((item.price || item.salePrice || 0) * item.quantity).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>

                    <div className="bg-white/80 border border-gray-100 rounded-2xl p-5 text-sm text-gray-600 mb-8 shadow-sm">
                      <p className="font-bold text-gray-900 mb-2 uppercase text-[10px] tracking-wider text-rust">Shipping Destination</p>
                      <p className="font-medium text-gray-800 mb-0.5">{shippingData.firstName} {shippingData.lastName}</p>
                      <p className="font-light">{shippingData.address}, {shippingData.city}, {shippingData.state} - {shippingData.pincode}</p>
                      <p className="mt-2 text-xs font-light text-gray-400">{shippingData.phone} | {shippingData.email}</p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ink-black py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-rust transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                      >
                        <Lock size={14} /> Place Order — ₹{finalTotal.toLocaleString()}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-6 sticky top-28">
                <h2 className="font-heqra text-xl font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">Order Summary</h2>
                <ul className="flex flex-col gap-4 mb-5">
                  {cartItems.map(item => (
                    <li key={item.id} className="flex items-center gap-3.5 text-sm">
                      <div className="relative h-14 w-11 shrink-0 shadow-sm rounded-md overflow-hidden border border-gray-150">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-ink-black text-[9px] font-bold text-white flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate text-gray-700 font-medium">{item.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-light">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-bold text-gray-900">₹{((item.price || item.salePrice || 0) * item.quantity).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-100 pt-4 flex flex-col gap-2.5 text-sm">
                  <div className="flex justify-between text-gray-500 font-light">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-800">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-light">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 font-bold' : 'font-medium text-gray-800'}>
                      {shipping === 0 ? 'Free' : `₹${shipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-heqra text-lg font-bold text-ink-black border-t border-gray-100 pt-3 mt-1.5">
                    <span>Total</span>
                    <span>₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Trust Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 border-t border-gray-100/60 pt-4 text-gray-400 select-none">
                  <ShieldCheck size={16} className="text-green-500" />
                  <span className="font-outfit text-[10px] font-semibold uppercase tracking-widest">Secured Checkout</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
