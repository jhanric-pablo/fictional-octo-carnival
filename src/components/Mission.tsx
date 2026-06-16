import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export default function Mission() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const img1Y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const img2Y = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section id="mission" ref={containerRef} style={{ position: 'relative' }} className="py-32 md:py-48 bg-ink text-paper relative overflow-hidden">
      
      {/* Background Graphic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border-[1px] border-paper/5 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] border-[1px] border-paper/10 rounded-full pointer-events-none" />

      <div className="max-w-[90rem] mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center">
        
        {/* Typographic Statement */}
        <div className="w-full text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-3 mb-12 opacity-80"
          >
            <span className="uppercase tracking-[0.3em] text-[10px] font-bold text-primary">Our Mission</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-5xl md:text-7xl lg:text-[110px] font-medium leading-[0.9] tracking-tight mb-16"
          >
            Every <span className="text-primary italic">Soul Matters</span> <br />
            <span className="text-paper/40 italic text-4xl md:text-6xl lg:text-[80px]">Save lives through action.</span>
          </motion.h2>
        </div>

        {/* Supporting Visuals & Content */}
        <div className="flex flex-col md:flex-row mt-20 gap-16 md:gap-8 items-center w-full">
          <div className="md:w-1/3 w-full">
            <motion.div style={{ y: img1Y }} className="aspect-[3/4] rounded-[2vw] overflow-hidden w-full max-w-sm mx-auto">
              <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop" alt="Dog being petted" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700 hover:scale-110" />
            </motion.div>
          </div>
          
          <div className="md:w-1/3 w-full flex justify-center text-center">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-paper/60 text-lg md:text-xl leading-relaxed max-w-sm font-light"
            >
              Smart Stray bridges the gap between concerned citizens and active rescue units by providing a centralized, real-time alert system. By integrating location mapping and instant dispatch features, we drastically reduce the response time for animals in distress.
            </motion.p>
          </div>

          <div className="md:w-1/3 w-full">
            <motion.div style={{ y: img2Y }} className="aspect-[4/3] rounded-[2vw] overflow-hidden w-full max-w-sm mx-auto mt-12 md:mt-32">
              <img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800&auto=format&fit=crop" alt="Cat in the street" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700 hover:scale-110" />
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
