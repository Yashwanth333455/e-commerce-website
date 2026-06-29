import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";

const products = [
  {
    id: "01",
    collection: "Collection 24",
    title: "Mens Wear",
    image: "/mens-wear.png",
    color: "bg-tan",
    speed: [0, -150],
    category: null,         // coming soon — no navigation
    comingSoon: true,
  },
  {
    id: "02",
    collection: "Collection 24",
    title: "Womens Wear",
    image: "/womens-wear.png",
    color: "bg-dusty-rose",
    speed: [60, -180],
    category: "Women's Wear",
    comingSoon: false,
  },
  {
    id: "03",
    collection: "Collection 24",
    title: "Kids Wear",
    image: "/kids-wear.png",
    color: "bg-rust",
    speed: [-60, 120],
    category: "Kids Wear",
    comingSoon: false,
  },
];

const ProductCard = ({ product, index }) => {
  const ref = useRef(null);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress, 
    [0, 1], 
    isMobile ? [0, 0] : product.speed
  );
  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, 0] : [index % 2 === 0 ? -5 : 5, index % 2 === 0 ? 5 : -5]
  );

  const topOffset =
    !isMobile && index === 1 ? "mt-[18%]" : !isMobile && index === 2 ? "mt-[36%]" : "";

  const handleClick = () => {
    if (product.comingSoon) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/shop?category=${encodeURIComponent(product.category)}`);
  };

  return (
    <motion.div
      ref={ref}
      style={{ y, rotate }}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${topOffset}`}
    >
      <div
        onClick={handleClick}
        className={`relative overflow-hidden aspect-[3/4] group shadow-2xl ${product.comingSoon ? "cursor-default" : "cursor-pointer"}`}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          whileInView={{ scale: 1.2, opacity: 0.3 }}
          transition={{ duration: 2, ease: "circOut" }}
          className={`absolute inset-0 ${product.color} rounded-full blur-[80px] translate-y-12 group-hover:scale-150 transition-transform duration-1000`}
        />

        <motion.img
          src={product.image}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 1, ease: "circOut" }}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[filter,transform] duration-1000 relative z-10 [will-change:filter,transform]"
          alt={product.title}
        />

        {/* Coming Soon badge — only on Men's Wear */}
        {product.comingSoon && (
          <div className="absolute top-3 left-3 z-30">
            <span className="bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20">
              Coming Soon
            </span>
          </div>
        )}

        {/* Hover overlay — only on non-coming-soon cards */}
        {!product.comingSoon && (
          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div
              className="border border-white rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md"
              style={{ width: "clamp(3rem, 7vw, 6rem)", height: "clamp(3rem, 7vw, 6rem)" }}
            >
              <span
                className="font-outfit font-black text-white uppercase text-center leading-tight"
                style={{ fontSize: "clamp(0.3rem, 0.7vw, 0.55rem)", letterSpacing: "0.1em" }}
              >
                View Details
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 sm:mt-6 md:mt-12 overflow-hidden">
        <motion.div
          initial={{ y: "100%", skewX: -20 }}
          whileInView={{ y: 0, skewX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: index * 0.2 + 0.5, ease: "circOut" }}
        >
          <div
            className="mb-1 md:mb-3 text-ink-black/30 font-black font-outfit uppercase"
            style={{ fontSize: "clamp(0.35rem, 0.8vw, 0.625rem)", letterSpacing: "0.25em" }}
          >
            {product.id} // {product.collection}
          </div>
          <h3
            className="font-black uppercase tracking-tighter font-syne leading-none group-hover:translate-x-2 transition-transform duration-500"
            style={{ fontSize: "clamp(0.8rem, 2.5vw, 2.25rem)" }}
          >
            {product.title}
          </h3>
        </motion.div>
      </div>
    </motion.div>
  );
};

const EditorialSelections = () => {
  return (
    <section className="py-12 sm:py-20 md:py-48 lg:py-80 px-4 sm:px-8 md:px-10 bg-white relative overflow-hidden">

      {/* Background editorial watermark */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-5 hidden md:block">
        <div className="font-heqra text-ink-black absolute top-1/4 -left-1/4 scale-150 rotate-[-10deg] whitespace-nowrap">
          EDITORIAL EDITORIAL EDITORIAL
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">

        {/* Section header */}
        <div className="flex flex-row items-start gap-4 sm:gap-8 md:gap-12 mb-10 sm:mb-20 md:mb-40 lg:mb-60">

          {/* Left: heading + bar */}
          <div className="w-2/3">
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%", skewY: 10 }}
                whileInView={{ y: 0, skewY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className="font-heqra leading-[0.85] tracking-tight mb-4 md:mb-10 text-ink-black"
                style={{ fontSize: "clamp(2.5rem, 8.5vw, 10.5rem)" }}
              >
                INDIE<br />STYLE<span className="text-rust">.</span>
              </motion.h2>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.6, ease: [0.19, 1, 0.22, 1] }}
              className="bg-ink-black origin-left"
              style={{ height: "clamp(0.4rem, 0.8vw, 1rem)", width: "clamp(5rem, 30vw, 31rem)" }}
            />
          </div>

          {/* Right: description text */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 0.8, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 1 }}
            className="w-1/3 font-outfit font-semibold text-ink-black leading-relaxed pt-2 md:pt-10"
            style={{ fontSize: "clamp(0.5rem, 1.4vw, 1.5rem)" }}
          >
            A curated dialogue between structure and organic form. We explore
            the boundaries of high-fashion minimalism through precise tailoring
            and monochromatic depths.
          </motion.div>
        </div>

        {/* Product cards — responsive: 1 column on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 lg:gap-24 relative">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorialSelections;
