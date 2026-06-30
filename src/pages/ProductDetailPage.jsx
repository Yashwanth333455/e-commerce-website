import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Star, Heart, ShoppingBag, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Truck, RefreshCw, Lock, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { API_BASE_URL } from "../config";

/* ─── Static reviews per product ─── */
const REVIEWS = {
  default: [
    { id: 1, name: "Priya S.",    rating: 5, date: "12 Jun 2025", comment: "Absolutely beautiful! The fabric quality is top-notch and the fit is perfect. Got so many compliments." },
    { id: 2, name: "Meena R.",    rating: 4, date: "3 Jun 2025",  comment: "Lovely design and great stitching. The color in person is even more vibrant than in the photos." },
    { id: 3, name: "Aisha K.",    rating: 5, date: "28 May 2025", comment: "Ordered for my cousin's wedding and it was a hit! Delivery was fast and packaging was really nice." },
    { id: 4, name: "Divya M.",    rating: 4, date: "15 May 2025", comment: "Good quality for the price. Sizing is accurate — I went with M and it fits perfectly." },
    { id: 5, name: "Sunita P.",   rating: 3, date: "2 May 2025",  comment: "Nice product but the dupatta color was slightly different from the image. Overall still happy with the purchase." },
  ],
};

/* ─── Product details/specs ─── */
const PRODUCT_DETAILS = {
  default: {
    fabric: "Premium Quality Fabric",
    work: "Embroidery & Handwork",
    occasion: "Festive, Wedding, Party",
    weight: "1.2 KG",
    care: "Dry Clean / Gentle Hand Wash",
    description: "A stunning piece crafted with care, this outfit features intricate detailing and premium fabric. Designed to make you stand out at any occasion — from festive gatherings to wedding celebrations. The rich color and fine embroidery give it a regal, timeless look.",
  },
};

const getDetails = (id) => PRODUCT_DETAILS[id] || PRODUCT_DETAILS.default;
const getReviews = (id) => REVIEWS[id] || REVIEWS.default;

/* ─── Star display ─── */
function Stars({ rating, size = 16 }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? "#D4AF37" : "none"}
          stroke={i < rating ? "#D4AF37" : "#cbd5e1"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const found = data.find(p => p.id === Number(id));
        setProduct(found || products.find(p => p.id === Number(id)));
      } catch {
        setProduct(products.find(p => p.id === Number(id)));
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-xs text-slate-400 tracking-wider uppercase font-semibold">Loading Product details...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <p className="text-2xl text-gray-400 font-serif">Product not found</p>
        <button onClick={() => navigate("/shop")} className="mt-4 text-violet-400 hover:underline">
          Back to Shop
        </button>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}

function ProductDetail({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const galleryImages = [product.image, product.image, product.image, product.image];

  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const imgRef = useRef(null);

  const details = getDetails(product.id);
  const reviews = getReviews(product.id);
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  const relatedProducts = products.filter(
    (p) => p.id !== product.id && p.category === product.category
  ).slice(0, 5);

  const handleMouseMove = (e) => {
    if (!zoom || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    addToCart({ ...product, selectedSize, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const displayPrice = Number(product.price ?? 0);
  const originalPrice = Number(product.originalPrice || 0);
  const discountPct = originalPrice > displayPrice && displayPrice > 0
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <Navbar />

      <div className="pt-28 md:pt-32 pb-16">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
          <nav className="flex items-center gap-2 text-[13px] text-gray-400">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-gray-700">Shop</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

            {/* ── LEFT: Image Gallery ── */}
            <div className="flex flex-col gap-4">
              {/* Main image with zoom */}
              <div
                ref={imgRef}
                className={`relative overflow-hidden rounded-2xl bg-[#F5F3F0] cursor-${zoom ? "zoom-out" : "zoom-in"}`}
                style={{ aspectRatio: "3/4" }}
                onClick={() => setZoom((z) => !z)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setZoom(false)}
              >
                <img
                  src={galleryImages[activeImg]}
                  alt={product.name}
                  className="w-full h-full transition-transform duration-200"
                  style={
                    zoom
                      ? {
                          transform: "scale(2.2)",
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                          objectFit: "cover",
                        }
                      : { objectFit: "cover", objectPosition: "top" }
                  }
                  draggable={false}
                />

                {/* Zoom hint */}
                <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-600 shadow-sm pointer-events-none">
                  {zoom ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
                  {zoom ? "Click to zoom out" : "Click to zoom in"}
                </div>

                {/* Prev / Next arrows */}
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImg((i) => (i - 1 + galleryImages.length) % galleryImages.length); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImg((i) => (i + 1) % galleryImages.length); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Badge */}
                {product.badge && (
                  <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ${
                    product.badge === "SALE" ? "bg-red-500" :
                    product.badge === "NEW"  ? "bg-[#8E9AAF]" :
                    product.badge === "HOT"  ? "bg-orange-500" : "bg-gray-900"
                  }`}>
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`overflow-hidden rounded-xl border-2 transition-all ${
                      activeImg === i ? "border-[#8E9AAF] shadow-md" : "border-transparent hover:border-gray-300"
                    }`}
                    style={{ aspectRatio: "3/4" }}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${i + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div className="flex flex-col gap-5">

              {/* Name & rating */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8E9AAF] mb-1">{product.category}</p>
                <h1 className="font-serif text-[26px] md:text-[30px] font-semibold text-gray-900 leading-snug">{product.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Stars rating={Math.round(product.rating)} />
                  <span className="text-[13px] text-gray-500">({product.reviews} reviews)</span>
                  <span className={`ml-2 text-[12px] font-semibold ${product.inStock ? "text-green-600" : "text-red-500"}`}>
                    {product.inStock ? "● In Stock" : "● Out of Stock"}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[32px] font-bold text-gray-900">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-[18px] text-gray-400 line-through">
                      ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {discountPct}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-[14px] text-gray-650 leading-relaxed font-light">{product.description || details.description}</p>

              {/* Specs table */}
              <div className="rounded-xl border border-gray-100 overflow-hidden text-[13px]">
                {[
                  { label: "Fabric",     value: details.fabric    },
                  { label: "Work",       value: details.work      },
                  { label: "Occasion",   value: details.occasion  },
                  { label: "Weight",     value: details.weight    },
                  { label: "Care",       value: details.care      },
                ].map((row, i) => (
                  <div key={row.label} className={`flex ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                    <span className="w-28 shrink-0 px-4 py-2.5 font-semibold text-gray-500 border-r border-gray-100">{row.label}</span>
                    <span className="px-4 py-2.5 text-gray-700">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Size selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-semibold text-gray-800">
                    Size: <span className="text-[#8E9AAF]">{selectedSize || "Select a size"}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ["XS","S","M","L","XL","XXL"]).map((size) => (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setSizeError(false); }}
                      className={`min-w-[52px] rounded-full border px-4 py-2 text-[13px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#CBC0D3] ${
                        selectedSize === size
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-900"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {sizeError && (
                  <p className="mt-2 text-[12px] text-red-500 font-medium">Please select a size before adding to cart.</p>
                )}
              </div>

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Quantity */}
                <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-2.5 text-lg font-bold text-gray-600 hover:bg-gray-50 transition"
                    aria-label="Decrease quantity"
                  >−</button>
                  <span className="px-4 py-2 text-[15px] font-semibold text-gray-900 min-w-[40px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-4 py-2.5 text-lg font-bold text-gray-600 hover:bg-gray-50 transition"
                    aria-label="Increase quantity"
                  >+</button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-full py-3 px-6 font-semibold text-[14px] transition-all focus:outline-none focus:ring-2 focus:ring-[#CBC0D3] ${
                    added
                      ? "bg-green-500 text-white"
                      : product.inStock
                        ? "bg-gray-900 text-white hover:bg-gray-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {added ? <><Check size={16} /> Added to Cart!</> : <><ShoppingBag size={16} /> Add to Cart</>}
                </button>

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 hover:border-[#d63384] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CBC0D3]"
                  aria-label="Add to wishlist"
                >
                  <Heart size={18} fill={wishlisted ? "#d63384" : "none"} stroke={wishlisted ? "#d63384" : "#6b7280"} />
                </button>
              </div>

              {/* Delivery info */}
              <div className="rounded-xl bg-[#F5F3F0] px-4 py-3 flex items-center gap-3 text-[13px] text-gray-600">
                <Truck size={16} className="text-[#8E9AAF] shrink-0" />
                <span>Estimated delivery: <strong className="text-gray-800">3–9 business days</strong></span>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Truck,     label: "Free Shipping",  sub: "Above ₹999" },
                  { icon: RefreshCw, label: "Easy Returns",   sub: "7-day policy" },
                  { icon: Lock,      label: "Secure Payment", sub: "100% safe"  },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center text-center rounded-xl border border-gray-100 bg-white py-3 px-2">
                    <b.icon size={20} className="mb-1 text-[#8E9AAF]" strokeWidth={1.5} />
                    <span className="text-[11px] font-semibold text-gray-800">{b.label}</span>
                    <span className="text-[10px] text-gray-400">{b.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Reviews ── */}
          <section className="mt-16">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900">Customer Reviews</h2>
              <div className="flex items-center gap-2 bg-[#F5F3F0] rounded-full px-4 py-1.5">
                <Stars rating={Math.round(Number(avgRating))} size={14} />
                <span className="text-[13px] font-bold text-gray-800">{avgRating}</span>
                <span className="text-[12px] text-gray-400">/ 5</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#EFD3D7] to-[#CBC0D3] flex items-center justify-center text-[13px] font-bold text-gray-700">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{review.name}</p>
                        <p className="text-[11px] text-gray-400">{review.date}</p>
                      </div>
                    </div>
                    <Stars rating={review.rating} size={13} />
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Related Products ── */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-6">Related Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {relatedProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { window.scrollTo(0, 0); navigate(`/product/${p.id}`); }}
                    className="text-left group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-[#CBC0D3]"
                  >
                    <div className="overflow-hidden bg-[#F5F3F0]" style={{ aspectRatio: "3/4" }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover object-top group-hover:scale-[1.04] transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E9AAF] truncate">{p.category}</p>
                      <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[13px] font-bold text-gray-900">₹{p.price.toLocaleString("en-IN")}</span>
                        {p.originalPrice && (
                          <span className="text-[11px] text-gray-400 line-through">₹{p.originalPrice.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
