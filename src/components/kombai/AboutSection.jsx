import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

const AboutSection = () => {
  const navigate = useNavigate();
  return (
    <section
      id="about-section"
      className="py-12 sm:py-20 md:py-40 text-ink-black relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #F5F0EB 0%, #EDE5DC 50%, #F5F0EB 100%)" }}
    >
      <div className="px-4 sm:px-8 md:px-10 max-w-[1400px] mx-auto relative z-10">

        {/* Full-width Title */}
        <div className="mb-8 sm:mb-14 md:mb-24">
          <motion.h2
            initial={{ y: "100%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-syne font-extrabold uppercase tracking-tighter leading-[0.85] drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
            style={{ fontSize: "clamp(2rem, 9vw, 11rem)" }}
          >
            <span className="text-ink-black">Beyond</span><br />
            <span className="text-rust">Fashion</span>
            <span className="text-dusty-rose">.</span>
          </motion.h2>
        </div>

        {/* Two-column layout — stacks on mobile */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-16 lg:gap-24 items-center">

          {/* Image column */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative group"
            >
              <div className="absolute -inset-2 md:-inset-4 border border-ink-black/5 -z-10 group-hover:scale-105 transition-transform duration-1000" />
              <img
                src="https://images.unsplash.com/photo-1741605115333-aa254c5c57ab?auto=format&w=1200&q=80&fit=crop"
                alt="Showcase"
                className="w-full grayscale group-hover:grayscale-0 transition-all duration-1000 shadow-2xl"
              />

              {/* Marker lines */}
              <div
                className="absolute -bottom-4 -right-3 md:-bottom-10 md:-right-8 flex flex-col justify-between z-20 pointer-events-none -rotate-2"
                style={{ width: "55%", height: "clamp(1.5rem, 3vw, 4rem)" }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.2, duration: 1.2, ease: "circOut" }}
                    className="marker-line origin-left"
                    style={{ width: i === 1 ? "85%" : "100%" }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Text column */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.8 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="font-outfit leading-relaxed font-medium text-ink-black/80 mb-6 md:mb-12"
              style={{ fontSize: "clamp(0.6rem, 1.8vw, 1.5rem)" }}
            >
              Design is not what we add, but what we have the courage to leave
              out. Every stitch in our archive follows a singular philosophy of
              absolute reduction.
            </motion.p>

            <div className="flex flex-col gap-4 md:gap-10 items-start">
               <motion.button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'instant' });
                  navigate('/shop');
                }}
                whileHover={{ scale: 1.05, backgroundColor: "#111111", color: "#FFFFFF" }}
                whileTap={{ scale: 0.95 }}
                className="border-2 md:border-4 border-ink-black font-outfit font-bold uppercase tracking-widest transition-colors duration-500 cursor-pointer"
                style={{
                  fontSize: "clamp(0.45rem, 1vw, 0.75rem)",
                  padding: "clamp(0.4rem, 1.2vw, 1.75rem) clamp(0.6rem, 2.5vw, 3.5rem)",
                  letterSpacing: "0.2em",
                }}
              >
                View 2026 Archive
              </motion.button>

              <div
                className="flex gap-3 sm:gap-6 md:gap-12 font-outfit font-bold uppercase opacity-40 flex-wrap"
                style={{ fontSize: "clamp(0.4rem, 0.9vw, 0.625rem)", letterSpacing: "0.2em" }}
              >
                {["Tailored Suits", "Evening Silks", "Bridal White"].map((text, i) => (
                  <motion.span
                    key={text}
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    {text}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
