import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { products } from "../../data/products";

const bgImages = Array.from(
  new Set([
    "/pexels-susheelparihar-33180676.jpg",
    "/floral-cotton-kurti.jpg",
    "/pexels-shootsaga-36607719.jpg",
    "/kids-wear.png",
    "/mens-wear.png",
    "/womens-wear.png",
    "/pexels-ab_h_i-s_h_ek_09-283673767-33566411.jpg",
    "/pexels-artosuraj-28284555.jpg",
    "/pexels-deepak-sharma-503041381-35591476.jpg",
    "/pexels-dhanno-19589907.jpg",
    "/pexels-hemant-saini-2148893253-33229250.jpg",
    "/pexels-jeegzart-photography-2000617-16375802.jpg",
    "/pexels-kevinshrmasc-30899451.jpg",
    "/pexels-krishna-sridhar-photography-1233436552-28954056.jpg",
    "/pexels-p-g-354416850-29151649.jpg",
    ...products.map((p) => p.image),
  ].filter(Boolean))
);

const HeroSection = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Shuffle card states
  const [card1Img, setCard1Img] = useState("/pexels-susheelparihar-33180676.jpg");
  const [card2Img, setCard2Img] = useState("/floral-cotton-kurti.jpg");
  const [card1State, setCard1State] = useState("back"); // Card 1 starts at back
  const [card2State, setCard2State] = useState("front"); // Card 2 starts at front
  const [poolIndex, setPoolIndex] = useState(2); // Start drawing next images from index 2

  const handleMouseMove = (e) => {
    if (isMobile) return; // Disable parallax mouse tracking on mobile
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 40;
    const y = (clientY / innerHeight - 0.5) * 40;
    setMousePos({ x, y });
  };

  // Card shuffler timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (card1State === "front") {
        // Card 1 is front: slide it out, change image, slide back in at back
        setCard1State("shuffle");
        setTimeout(() => {
          setCard1Img(bgImages[poolIndex]);
          setPoolIndex((prev) => (prev + 1) % bgImages.length);
          setCard1State("back");
          setCard2State("front");
        }, 400);
      } else {
        // Card 2 is front: slide it out, change image, slide back in at back
        setCard2State("shuffle");
        setTimeout(() => {
          setCard2Img(bgImages[poolIndex]);
          setPoolIndex((prev) => (prev + 1) % bgImages.length);
          setCard2State("back");
          setCard1State("front");
        }, 400);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [card1State, card2State, poolIndex]);

  const marqueeItems = [
    "New Arrivals", "★", "Mens Wear", "★", "Womens Wear",
    "★", "Kids Wear", "★", "Summer 2025", "★", "Free Shipping", "★",
  ];

  const handleShopNow = () => {
    navigate('/shop');
  };

  // Text reveal animation configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: "100%", skewY: 7 },
    visible: {
      y: 0,
      skewY: 0,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Stacked card animation variants
  const card1Variants = {
    front: {
      left: isMobile ? "-20px" : "-40px",
      bottom: isMobile ? "-16px" : "-32px",
      width: "60%",
      height: "80%",
      x: isMobile ? 0 : mousePos.x * 0.25,
      y: isMobile ? 0 : mousePos.y * 0.25,
      scale: 1,
      rotate: -5,
      zIndex: 20,
      borderWidth: isMobile ? "3px" : "6px",
      borderColor: "#ffffff",
      opacity: 1,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] }
    },
    back: {
      left: "0px",
      bottom: "0px",
      width: "100%",
      height: "100%",
      x: isMobile ? 0 : mousePos.x * -0.2,
      y: isMobile ? 0 : mousePos.y * -0.2,
      scale: 1,
      rotate: 0,
      zIndex: 10,
      borderWidth: "0px",
      borderColor: "rgba(255,255,255,0)",
      opacity: 1,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] }
    },
    shuffle: {
      x: isMobile ? -140 : -280,
      y: isMobile ? 20 : 40,
      scale: 0.95,
      rotate: -15,
      zIndex: 25,
      opacity: 0.9,
      transition: { duration: 0.35, ease: "easeOut" }
    }
  };

  const card2Variants = {
    front: {
      left: isMobile ? "-20px" : "-40px",
      bottom: isMobile ? "-16px" : "-32px",
      width: "60%",
      height: "80%",
      x: isMobile ? 0 : mousePos.x * 0.25,
      y: isMobile ? 0 : mousePos.y * 0.25,
      scale: 1,
      rotate: -5,
      zIndex: 20,
      borderWidth: isMobile ? "3px" : "6px",
      borderColor: "#ffffff",
      opacity: 1,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] }
    },
    back: {
      left: "0px",
      bottom: "0px",
      width: "100%",
      height: "100%",
      x: isMobile ? 0 : mousePos.x * -0.2,
      y: isMobile ? 0 : mousePos.y * -0.2,
      scale: 1,
      rotate: 0,
      zIndex: 10,
      borderWidth: "0px",
      borderColor: "rgba(255,255,255,0)",
      opacity: 1,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] }
    },
    shuffle: {
      x: isMobile ? -140 : -280,
      y: isMobile ? 20 : 40,
      scale: 0.95,
      rotate: -15,
      zIndex: 25,
      opacity: 0.9,
      transition: { duration: 0.35, ease: "easeOut" }
    }
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative flex flex-col overflow-x-hidden bg-white select-none"
    >
      {/* ── Background Ambient Blobs ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: mousePos.x * 0.8,
            y: mousePos.y * 0.8,
          }}
          transition={{ type: "spring", stiffness: 35, damping: 25 }}
          className="absolute -top-[10%] right-[30%] w-[35vw] h-[35vw] rounded-full bg-brand-pink/30 blur-[100px]"
        />
        <motion.div
          animate={{
            x: mousePos.x * -0.5,
            y: mousePos.y * -0.5,
          }}
          transition={{ type: "spring", stiffness: 35, damping: 25 }}
          className="absolute top-[30%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-brand-lavender/25 blur-[120px]"
        />
        <motion.div
          animate={{
            x: mousePos.x * 0.4,
            y: mousePos.y * -0.4,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
          className="absolute -bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-dusty-rose/20 blur-[90px]"
        />
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
        
        {/* ── Left Column: Editorial Details ── */}
        <div className="relative z-20 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 pt-28 pb-12 w-full lg:w-[58%]">
          
          {/* Floating Large Background Watermark "07" */}
          <div className="absolute top-[12%] right-[8%] opacity-[0.03] pointer-events-none font-anola font-bold text-[28vw] leading-none text-ink-black select-none z-0">
            07
          </div>

          {/* Micro Label / Badge */}
          <div className="mb-6 overflow-hidden z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rust/15 bg-brand-rose/40 backdrop-blur-sm shadow-sm"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={12} className="text-rust" />
              </motion.span>
              <span className="font-outfit font-bold uppercase tracking-[0.3em] text-rust text-[8px] sm:text-[9px]">
                Elegance Redefined · Est. 2019
              </span>
            </motion.div>
          </div>

          {/* Staggered Heading Reveal using Anola/Italiana */}
          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="font-anola leading-[0.85] tracking-tight mb-8 z-10"
          >
            <div className="overflow-hidden pb-1">
              <motion.span
                variants={itemVariants}
                className="inline-block text-ink-black italic font-light"
                style={{ fontSize: "clamp(3rem, 9.5vw, 8.5rem)" }}
              >
                Crafting
              </motion.span>
            </div>
            <div className="overflow-hidden pb-1 mt-1">
              <motion.span
                variants={itemVariants}
                className="inline-block text-rust uppercase tracking-[0.08em]"
                style={{ fontSize: "clamp(2.4rem, 8vw, 7.2rem)" }}
              >
                Elegance
              </motion.span>
              <motion.span
                variants={itemVariants}
                className="inline-block text-ink-black"
                style={{ fontSize: "clamp(2.4rem, 8vw, 7.2rem)" }}
              >
                .
              </motion.span>
            </div>
          </motion.h1>

          {/* Subtitle / Intro with thin left line */}
          <div className="overflow-hidden mb-8 sm:mb-10 max-w-xl pl-6 border-l border-rust/30 z-10">
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-outfit text-ink-black/70 leading-relaxed font-light"
              style={{ fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)" }}
            >
              For over seven years, we have blended heritage craftsmanship with modern design. 
              Discover premium ethnic, women's, and kids' wear created for those who value detail.
            </motion.p>
          </div>

          {/* Interactive Call To Actions */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-4 sm:gap-6"
          >
            {/* Primary Button */}
            <motion.button
              onClick={handleShopNow}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center justify-center gap-3 bg-ink-black text-white font-syne font-bold uppercase tracking-[0.2em] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.875rem)", padding: "1.1rem 2.2rem" }}
            >
              <span className="relative z-10">Shop Collection</span>
              <ArrowRight
                size={16}
                className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-300"
              />
              <span className="absolute inset-0 bg-rust origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-0" />
            </motion.button>

            {/* Secondary Link Button */}
            <motion.button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                navigate('/about');
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center justify-center font-syne font-bold uppercase tracking-[0.2em] text-ink-black relative cursor-pointer"
              style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.875rem)", padding: "1.1rem 1.5rem" }}
            >
              <span>Our Story</span>
              <span className="absolute bottom-1.5 left-6 right-6 h-[2px] bg-rust scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </motion.button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-3 gap-0 mt-12 sm:mt-16 pt-8 border-t border-ink-black/10 divide-x divide-ink-black/10"
          >
            {[
              { number: "7+", suffix: "Yrs", label: "Heritage" },
              { number: "50K+", suffix: "", label: "Happy Customers" },
              { number: "2K+", suffix: "", label: "Unique Designs" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center text-center px-4 relative group cursor-default"
              >
                {/* Micro Star that spins on hover */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="inline-block text-rust text-[10px]"
                  >
                    ✦
                  </motion.span>
                </div>

                {/* Stat Number using Heqra */}
                <div
                  className="font-heqra text-ink-black tracking-tight leading-none mb-2 select-none"
                  style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)" }}
                >
                  {stat.number}
                  {stat.suffix && (
                    <span className="font-serif italic text-rust text-[60%] ml-1">{stat.suffix}</span>
                  )}
                </div>

                {/* Stat Label */}
                <div
                  className="font-outfit uppercase tracking-[0.2em] text-ink-black/40 text-[7px] sm:text-[9px] group-hover:text-rust transition-colors duration-300"
                >
                  {stat.label}
                </div>

                {/* Interactive Accent Dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-rust scale-0 group-hover:scale-100 transition-transform duration-300 mt-2.5" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── Right Column: Dual Overlapping Parallax Images ── */}
        <div className="relative w-full lg:w-[42%] min-h-[70vh] lg:min-h-screen flex items-center justify-center p-6 md:p-12 overflow-hidden">
          
          {/* Parallax Container */}
          <div className="relative w-full max-w-[420px] aspect-[3/4] z-10">
            
            {/* Card 1 */}
            <motion.div
              animate={card1State}
              variants={card1Variants}
              className="absolute rounded-3xl overflow-hidden shadow-2xl bg-brand-lavender/20"
              style={{ borderStyle: "solid" }}
            >
              <img
                src={card1Img}
                alt="Sai Deepthi Dresses Premium Fashion"
                className="w-full h-full object-cover object-top"
              />
            </motion.div>

            {/* Card 2 */}
            <motion.div
              animate={card2State}
              variants={card2Variants}
              className="absolute rounded-3xl overflow-hidden shadow-2xl bg-brand-pink/20"
              style={{ borderStyle: "solid" }}
            >
              <img
                src={card2Img}
                alt="Sai Deepthi Dresses Premium Fashion"
                className="w-full h-full object-cover object-top"
              />
            </motion.div>
            
            {/* Circular Rotating Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, delay: 1.4, ease: "backOut" }}
              className="absolute -top-6 -right-6 z-30"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md bg-ink-black/80 text-white shadow-xl"
              >
                {/* SVG Circular Text */}
                <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                  <path
                    id="circlePath"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    fill="none"
                  />
                  <text className="font-syne font-bold uppercase tracking-[0.2em] text-[7.5px] fill-white">
                    <textPath href="#circlePath" startOffset="0%">
                      ★ premium collection ★ estd 2019
                    </textPath>
                  </text>
                </svg>
              </motion.div>
            </motion.div>

            {/* Rotating Star Overlay on top of badge */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2 z-30 pointer-events-none w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
            >
              <span className="text-[14px] text-rust">✦</span>
            </motion.div>
          </div>

          {/* Decorative vertical lettering */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden lg:block"
          >
            <span
              className="font-outfit uppercase text-ink-black"
              style={{ writingMode: "vertical-rl", fontSize: "10px", letterSpacing: "0.5em" }}
            >
              Scroll to explore
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom Marquee Ticker ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="w-full py-4 sm:py-5 overflow-hidden relative z-30 border-y border-ink-black/5"
        style={{ background: "linear-gradient(135deg, #E2B6B5 0%, #D0BDB3 50%, #C87A5D 100%)" }}
      >
        <div className="kombai-animate-marquee flex whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="font-outfit font-bold uppercase text-white shrink-0 drop-shadow-sm flex items-center"
              style={{ fontSize: "clamp(0.7rem, 1.2vw, 0.95rem)", letterSpacing: "0.3em", margin: "0 2rem" }}
            >
              {item}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Scroll Indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 hidden lg:flex flex-col items-center gap-2 cursor-pointer"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} className="text-ink-black/40 hover:text-rust transition-colors" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
