import { useState, useMemo, useEffect } from "react";
import { ChevronDown, Filter, ChevronLeft, ChevronRight, Truck, RefreshCw, Lock, Star, Tag, Ticket, CreditCard, Gift, Clock, Sparkles } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import FilterSidebar from "./FilterSidebar";
import ProductCard from "./ProductCard";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { products } from "../data/products";
import { API_BASE_URL } from "../config";

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [productList, setProductList] = useState(products);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.length === 0) {
          console.log("Database is empty. Seeding products from client...");
          await fetch(`${API_BASE_URL}/api/products/seed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products })
          });
          const reloadRes = await fetch(`${API_BASE_URL}/api/products`);
          const reloadData = await reloadRes.json();
          setProductList(reloadData);
        } else {
          setProductList(data);
        }
      } catch (err) {
        console.error("API error, using static fallback products list:", err);
        setProductList(products);
      }
    }
    loadProducts();
  }, []);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const bannerSlides = useMemo(() => [
    { image: "/pexels-officialsourovsarker-34313230.jpg", name: "Yellow Chikankari Lehenga", category: "Ethnic Wear" },
    { image: "/pexels-arifsyd15-5197213.jpg", name: "Black Casual Shirt", category: "Women's Wear" },
    { image: "/pexels-gustavo-fring-8770947.jpg", name: "Yellow Lehenga Special", category: "Ethnic Wear" },
    { image: "/pexels-1054048-5721527.jpg", name: "Pink Floral Lehenga", category: "Women's Wear" },
    { image: "/pexels-dhanno-25184935.jpg", name: "Purple Floral Kurta", category: "Ethnic Wear" },
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % bannerSlides.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [bannerSlides]);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    try {
      return sessionStorage.getItem("shop_sortBy") || "Relevance";
    } catch {
      return "Relevance";
    }
  });
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = sessionStorage.getItem("shop_page");
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });
  const itemsPerPage = 8;

  // Sidebar filter state — never reset by URL changes
  const [sidebarCategories, setSidebarCategories] = useState(() => {
    try {
      const saved = sessionStorage.getItem("shop_categories");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [priceMax, setPriceMax] = useState(() => {
    try {
      const saved = sessionStorage.getItem("shop_priceMax");
      return saved ? Number(saved) : 10000;
    } catch {
      return 10000;
    }
  });
  const [selectedSizes, setSelectedSizes] = useState(() => {
    try {
      const saved = sessionStorage.getItem("shop_sizes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedColors, setSelectedColors] = useState(() => {
    try {
      const saved = sessionStorage.getItem("shop_colors");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedAvailability, setSelectedAvailability] = useState(() => {
    try {
      return sessionStorage.getItem("shop_availability") || "all";
    } catch {
      return "all";
    }
  });

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("shop_sortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem("shop_page", currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem("shop_categories", JSON.stringify(sidebarCategories));
  }, [sidebarCategories]);

  useEffect(() => {
    sessionStorage.setItem("shop_priceMax", priceMax.toString());
  }, [priceMax]);

  useEffect(() => {
    sessionStorage.setItem("shop_sizes", JSON.stringify(selectedSizes));
  }, [selectedSizes]);

  useEffect(() => {
    sessionStorage.setItem("shop_colors", JSON.stringify(selectedColors));
  }, [selectedColors]);

  useEffect(() => {
    sessionStorage.setItem("shop_availability", selectedAvailability);
  }, [selectedAvailability]);

  // Scroll Position Restoration
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem("shop_scroll", window.scrollY.toString());
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    try {
      const savedScroll = sessionStorage.getItem("shop_scroll");
      if (savedScroll) {
        const timer = setTimeout(() => {
          window.scrollTo(0, Number(savedScroll));
        }, 150); // slight delay to allow items to render
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Read URL params directly — no state sync, no useEffect reset
  const activeCategory = searchParams.get('category') || 'All';
  const searchQuery    = searchParams.get('q') || '';

  const handleCategoryToggle = (key) => {
    setSidebarCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setCurrentPage(1);
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
    setCurrentPage(1);
  };

  const handleColorToggle = (color) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSidebarCategories([]);
    setPriceMax(10000);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedAvailability("all");
    setCurrentPage(1);
  };

  const categoryPills = [
    "All", "Women's Wear", "Ethnic Wear", "Kids Wear", "Men's Wear", "Sarees",
    "New Arrivals", "Best Sellers", "Wedding Collection", "Festival Collection"
  ];

  const filteredProducts = useMemo(() => {
    let list = [...productList];

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Top pill category filter
    if (activeCategory !== "All") {
      const map = {
        "Women's Wear": "WOMEN'S WEAR",
        "Ethnic Wear": "ETHNIC WEAR",
        "Kids Wear": "KIDS WEAR",
        "Men's Wear": "MEN'S WEAR",
        "Sarees": "SAREES",
      };
      if (map[activeCategory]) {
        list = list.filter(p => p.category === map[activeCategory]);
      }
    }

    // Sidebar category checkboxes
    if (sidebarCategories.length > 0) {
      list = list.filter(p => sidebarCategories.includes(p.category));
    }

    // Price range
    list = list.filter(p => p.price <= priceMax);

    // Size filter
    if (selectedSizes.length > 0) {
      list = list.filter(p =>
        p.sizes && selectedSizes.some(s => p.sizes.includes(s))
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      list = list.filter(p =>
        p.colors && selectedColors.some(c => p.colors.includes(c))
      );
    }

    // Availability filter
    if (selectedAvailability === "in") {
      list = list.filter(p => p.inStock === true);
    } else if (selectedAvailability === "out") {
      list = list.filter(p => p.inStock === false);
    }

    // Sort
    switch (sortBy) {
      case "Price: Low to High":
        list.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        list.sort((a, b) => b.price - a.price);
        break;
      case "Highest Rated":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "Best Selling":
        list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
    }

    // Partition: Unique photoshoot series first, duplicate series last
    const uniqueImageProducts = [];
    const duplicateImageProducts = [];
    const seenSeries = new Set();

    list.forEach(p => {
      if (p.image) {
        // Extract prefix up to the last hyphen '-' to identify same photoshoot/model series
        const lastHyphenIndex = p.image.lastIndexOf('-');
        const seriesKey = lastHyphenIndex !== -1 
          ? p.image.substring(0, lastHyphenIndex) 
          : p.image;

        if (seenSeries.has(seriesKey)) {
          duplicateImageProducts.push(p);
        } else {
          seenSeries.add(seriesKey);
          uniqueImageProducts.push(p);
        }
      } else {
        uniqueImageProducts.push(p);
      }
    });

    return [...uniqueImageProducts, ...duplicateImageProducts];
  }, [productList, activeCategory, sortBy, searchQuery, sidebarCategories, priceMax, selectedSizes, selectedColors, selectedAvailability]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCategoryChange = (cat) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (cat === "All") {
        next.delete("category");
      } else {
        next.set("category", cat);
      }
      next.delete("q");
      return next;
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <Navbar />

      <div className="pb-24 lg:pb-0">
        {/* 2. SHOP HEADER */}
        <div className="border-b border-white/10 pt-36 md:pt-44 pb-0 text-center relative overflow-hidden bg-black text-white">
          
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-45 pointer-events-none"
          >
            <source src="/header-bg-video.mp4" type="video/mp4" />
          </video>

          {/* Luxury Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/85 z-0 pointer-events-none" />

          {/* Background Grid Elements */}
          <div className="absolute left-[20%] top-0 bottom-0 w-px bg-white/10 hidden lg:block z-0" />
          <div className="absolute right-[20%] top-0 bottom-0 w-px bg-white/10 hidden lg:block z-0" />
          
          {/* Left Minimalist Panel */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-start gap-1 text-left z-10 pointer-events-none select-none font-outfit text-white/50 uppercase">
            <span className="text-[10px] tracking-[0.25em] font-semibold text-rust">PG // 01</span>
            <span className="text-[10px] tracking-[0.25em] text-white/40">Shop Catalog</span>
          </div>

          {/* Right Minimalist Panel */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end gap-1 text-right z-10 pointer-events-none select-none font-outfit text-white/50 uppercase">
            <span className="text-[10px] tracking-[0.25em] font-semibold text-rust">SS // 25</span>
            <span className="text-[10px] tracking-[0.25em] text-white/40">Authentic Wear</span>
          </div>

          {/* Abstract Delicate Circular Lines (Instead of Cards/Images) */}
          <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/10 hidden lg:block z-0 animate-pulse" />
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/10 hidden lg:block z-0 animate-pulse" />

          {/* Main Header Content */}
          <div className="relative z-10 py-1 mb-8">
            <h1 className="font-anola text-[36px] md:text-[46px] text-white tracking-tight leading-none drop-shadow-md">
              Our <span className="italic text-rust font-light font-serif">Collection</span>
            </h1>
            <p className="mt-4 mb-2 text-[14px] md:text-[15px] font-light text-white/80 px-4 max-w-xl mx-auto drop-shadow-sm">
              {searchQuery ? (
                <>Results for <strong className="text-white">&quot;{searchQuery}&quot;</strong></>
              ) : (
                'Discover timeless fashion pieces curated for modern elegance.'
              )}
            </p>
          </div>
          

          {/* ── Announcement Ticker ── */}
          <div className="mt-0 relative overflow-hidden bg-[#1a1a1a] z-10" style={{ height: '48px' }}>

            {/* LEFT "LIMITED TIME" badge */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10,
              display: 'flex', alignItems: 'center',
              background: '#d63384',
              paddingLeft: '20px',
              paddingRight: '26px',
              clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)',
              gap: '7px',
            }}>
              <Clock size={12} color="#fff" strokeWidth={2.5} />
              <span style={{
                fontSize: '0.58rem',
                fontWeight: 800,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#fff',
                whiteSpace: 'nowrap',
                lineHeight: '1',
              }}>
                Limited Time
              </span>
            </div>

            {/* LEFT fade mask */}
            <div style={{
              position: 'absolute', left: '130px', top: 0, bottom: 0, width: '64px', zIndex: 5,
              background: 'linear-gradient(to right, #1a1a1a, transparent)',
              pointerEvents: 'none',
            }} />

            {/* RIGHT fade mask */}
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', zIndex: 5,
              background: 'linear-gradient(to left, #1a1a1a, transparent)',
              pointerEvents: 'none',
            }} />

            {/* Scrolling track */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              paddingLeft: '148px',
              overflow: 'hidden',
            }}>
              {[0, 1].map(set => (
                <div
                  key={set}
                  aria-hidden={set === 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    animation: 'ticker-scroll 36s linear infinite',
                  }}
                >
                  {[
                    { Icon: Gift,       text: '25% OFF when you buy 3 or more items' },
                    { Icon: Ticket,     text: 'Use code SD10 for extra 10% off' },
                    { Icon: Truck,      text: 'Free shipping on orders above ₹999' },
                    { Icon: CreditCard, text: 'Special offers on SBI & HDFC cards' },
                    { Icon: Tag,        text: 'Sale ends at midnight — shop now' },
                    { Icon: Sparkles,   text: 'New arrivals added every week' },
                  ].map((item, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center' }}>

                      {/* Diamond separator — only between items */}
                      {i > 0 && (
                        <span style={{
                          display: 'inline-block',
                          width: '5px', height: '5px',
                          background: '#d63384',
                          borderRadius: '1px',
                          transform: 'rotate(45deg)',
                          margin: '0 52px',
                          flexShrink: 0,
                          opacity: 0.85,
                        }} />
                      )}

                      {/* Icon + label */}
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        letterSpacing: '0.13em',
                        textTransform: 'uppercase',
                        color: '#f0f0f0',
                        whiteSpace: 'nowrap',
                      }}>
                        <item.Icon
                          size={14}
                          color="#d63384"
                          strokeWidth={2}
                          style={{ flexShrink: 0 }}
                        />
                        {item.text}
                      </span>
                    </span>
                  ))}

                  {/* Gap before the second loop starts */}
                  <span style={{ display: 'inline-block', width: '104px' }} />
                </div>
              ))}
            </div>

            <style>{`
              @keyframes ticker-scroll {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-100%); }
              }
            `}</style>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* 3. FILTER SIDEBAR */}
            <FilterSidebar
              isOpen={isMobileFilterOpen}
              onClose={() => setIsMobileFilterOpen(false)}
              selectedCategories={sidebarCategories}
              onCategoryChange={handleCategoryToggle}
              priceMax={priceMax}
              onPriceChange={(val) => { setPriceMax(val); setCurrentPage(1); }}
              selectedSizes={selectedSizes}
              onSizeChange={handleSizeToggle}
              selectedColors={selectedColors}
              onColorChange={handleColorToggle}
              selectedAvailability={selectedAvailability}
              onAvailabilityChange={(val) => { setSelectedAvailability(val); setCurrentPage(1); }}
              onClearAll={handleClearAll}
            />

            {/* 4. RIGHT COLUMN */}
            <div className="flex-1 min-w-0">

              {/* Category Pills & Sort */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAFAFA] py-4">
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 sm:pb-0">
                  {categoryPills.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => handleCategoryChange(pill)}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-[14px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CBC0D3] ${
                        activeCategory === pill
                          ? "border-[#CBC0D3] bg-[#EFD3D7] font-bold text-gray-900"
                          : "border-[#8E9AAF] bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      aria-label={`Filter by ${pill}`}
                      aria-pressed={activeCategory === pill}
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-gray-700 font-medium">Sort By:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="appearance-none rounded-md border border-gray-200 bg-white py-2 pl-3 pr-10 text-sm text-gray-900 outline-none focus:border-[#8E9AAF] focus:ring-2 focus:ring-[#CBC0D3] min-w-[160px]"
                      aria-label="Sort products"
                    >
                      <option>Relevance</option>
                      <option>Newest First</option>
                      <option>Best Selling</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Highest Rated</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              {paginatedProducts.length > 0 ? (
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="mt-16 text-center py-20">
                  <p className="font-serif text-2xl text-gray-400">
                    {searchQuery ? `No results for "${searchQuery}"` : 'No products found'}
                  </p>
                  <button
                    onClick={() => { handleCategoryChange('All'); }}
                    className="mt-4 text-sm text-[#8E9AAF] hover:underline font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}



              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 text-[14px] text-gray-700 hover:text-gray-900 mr-4 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#CBC0D3] rounded px-2 py-1"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#CBC0D3] ${
                        page === currentPage
                          ? "bg-[#8E9AAF] text-white"
                          : "text-gray-700 hover:bg-[#EFD3D7]"
                      }`}
                      aria-label={`Go to page ${page}`}
                      aria-current={page === currentPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 text-[14px] text-gray-700 hover:text-gray-900 ml-4 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#CBC0D3] rounded px-2 py-1"
                    aria-label="Next page"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Promo Banner (Redesigned Ultra-Premium Style) */}
          <div className="my-16 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121212] via-[#222222] to-[#121212] shadow-2xl relative">
            {/* Background glowing elements */}
            <div className="absolute right-0 top-0 h-full w-full opacity-30 pointer-events-none z-0">
              <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#C87A5D]/25 blur-[120px] animate-pulse" />
              <div className="absolute left-1/4 top-0 w-[200px] h-[200px] rounded-full bg-purple-500/10 blur-[80px]" />
            </div>

            {/* Rotating accent circle pattern */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute right-24 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-dashed border-[#C87A5D]/20 hidden lg:block z-0 pointer-events-none"
            />

            <div className="flex flex-col md:flex-row items-center justify-between px-8 md:px-16 py-12 md:py-16 relative z-10">
              
              {/* Left content */}
              <div className="max-w-md text-center md:text-left flex flex-col items-center md:items-start">
                {/* Pulsing Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C87A5D]/30 bg-[#C87A5D]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C87A5D]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C87A5D] animate-ping" />
                  Limited Time Offer
                </div>

                <h2 className="mt-6 font-heqra text-[38px] md:text-[50px] leading-tight text-white font-normal tracking-wide">
                  Summer <span className="italic text-[#C87A5D] font-light">Fashion Sale</span>
                </h2>
                
                <p className="mt-3 text-sm md:text-base text-white/70 font-outfit font-light tracking-wide max-w-sm">
                  Elevate your seasonal wardrobe with up to <span className="font-semibold text-white">40% OFF</span> our signature hand-curated edit.
                </p>

                <button 
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group relative overflow-hidden rounded-full border border-[#C87A5D] bg-transparent mt-8 px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:border-white cursor-pointer"
                >
                  <span className="absolute inset-0 bg-[#C87A5D] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left z-0" />
                  <span className="relative z-10 flex items-center gap-2">
                    Shop the Sale
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </button>
              </div>

              {/* Right side floating image collage */}
              <div className="mt-12 md:mt-0 relative z-10 flex items-center justify-center">
                <div className="relative hidden md:block overflow-hidden rounded-2xl border border-white/10 shadow-2xl rotate-3 transition-all duration-500 w-52 h-64 bg-gray-900 group">
                  <AnimatePresence>
                    <motion.div
                      key={activeSlideIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <img
                        src={bannerSlides[activeSlideIndex].image}
                        className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-700"
                        alt={bannerSlides[activeSlideIndex].name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                        <span className="font-heqra text-white text-xs tracking-wider">{bannerSlides[activeSlideIndex].name}</span>
                        <span className="font-outfit text-white/50 text-[10px] uppercase tracking-widest mt-0.5">{bannerSlides[activeSlideIndex].category}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Secondary decorative elements */}
                <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full border border-[#C87A5D]/40 bg-transparent hidden lg:block animate-bounce" style={{ animationDuration: '4s' }} />
              </div>

            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="border-t border-gray-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900">You May Also Like</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {products.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  onClick={() => { window.scrollTo(0, 0); navigate(`/product/${p.id}`); }}
                  className="shrink-0 w-[160px] sm:w-[180px] text-left focus:outline-none focus:ring-2 focus:ring-[#CBC0D3] rounded-xl"
                >
                  <div className="rounded-xl overflow-hidden bg-[#F5F3F0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-full h-[200px] sm:h-[220px] overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover object-top hover:scale-[1.04] transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="px-3 py-2 bg-white">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#8E9AAF] truncate">{p.category}</p>
                      <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">{p.name}</p>
                      <p className="text-[13px] font-bold text-gray-800 mt-1">₹{p.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges (Redesigned Editorial Style) */}
        <div className="border-t border-gray-100 bg-gradient-to-b from-[#FAFAFA] to-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { 
                  icon: Truck, 
                  title: "Free Shipping", 
                  sub: "On orders above ₹999", 
                  bgClass: "bg-[#EFD3D7]/20 border-[#EFD3D7]/30 text-[#C87A5D]",
                  hoverClass: "group-hover:animate-truck-drive" 
                },
                { 
                  icon: RefreshCw, 
                  title: "Easy Returns", 
                  sub: "7-day hassle-free returns", 
                  bgClass: "bg-[#CBC0D3]/20 border-[#CBC0D3]/30 text-indigo-700",
                  hoverClass: "group-hover:rotate-[360deg]" 
                },
                { 
                  icon: Lock, 
                  title: "Secure Payments", 
                  sub: "100% safe & encrypted", 
                  bgClass: "bg-[#DEE2FF]/20 border-[#DEE2FF]/30 text-sky-700",
                  hoverClass: "group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-6" 
                },
                { 
                  icon: Star, 
                  title: "Quality Assured", 
                  sub: "Curated premium fabrics", 
                  bgClass: "bg-[#FEEAFA]/30 border-[#FEEAFA]/40 text-pink-700",
                  hoverClass: "group-hover:rotate-[144deg] group-hover:scale-110 group-hover:text-pink-600" 
                }
              ].map((badge, idx) => (
                <div key={idx} className="group flex flex-col items-center text-center rounded-2xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-500 cursor-default">
                  <div className={`w-16 h-16 rounded-full border flex items-center justify-center mb-5 overflow-hidden transition-all duration-500 group-hover:scale-105 ${badge.bgClass}`}>
                    <badge.icon size={24} className={`transition-all duration-500 ease-out ${badge.hoverClass}`} strokeWidth={1.5} />
                  </div>
                  <h4 className="font-serif text-[17px] font-bold text-gray-900 leading-snug">{badge.title}</h4>
                  <p className="mt-2.5 text-xs text-gray-500 font-outfit font-light leading-relaxed max-w-[170px]">{badge.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <Footer />

      {/* Mobile Floating Filter Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 font-medium text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-[#CBC0D3] focus:ring-offset-2"
          aria-label="Open filters"
        >
          <Filter size={18} /> Filters
        </button>
      </div>
    </div>
  );
}
