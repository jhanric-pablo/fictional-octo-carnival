import { ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import SDFBlob from './SDFBlob';

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-paper flex flex-col justify-end">
      
      {/* Massive 3D Backdrop */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0 z-0 bg-paper-alt"
      >
        <SDFBlob />
      </motion.div>

      {/* Grid Overlay to give structure to the fullscreen scene */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-paper to-transparent z-0" />

      {/* Foreground Content */}
      <div className="relative z-10 w-full pb-12 pt-32 px-6 lg:px-12 flex flex-col justify-between h-full pointer-events-none">
        
        {/* Top Info */}
        <div className="flex justify-between items-start mt-12 md:mt-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 text-ink-muted rounded-full border border-border pointer-events-auto shadow-sm"
          >
            <MapPin size={14} className="text-ink-muted" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink">Parañaque City Division</span>
          </motion.div>
        </div>

        {/* Bottom Massive Typography */}
        <div className="mb-8 relative pointer-events-auto">
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
            className="relative z-10 text-[14vw] md:text-[11vw] font-serif font-medium leading-[0.8] tracking-tight text-ink uppercase"
          >
            Smart Stray <br/>
            <span className="italic font-light opacity-90 ml-[10vw]">Rescue</span>
          </motion.h1>

          <div className="mt-12 flex flex-col md:flex-row justify-between items-end gap-8 border-t border-ink/20 pt-8">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-xl text-ink-muted font-medium max-w-sm leading-snug"
            >
              The official real-time reporting system. Act fast, report sightings, and help us give every stray a chance.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a href="#report" className="px-8 py-4 bg-ink text-white hover:bg-ink-muted rounded-full flex items-center justify-center gap-2 group transition-all font-bold text-xs uppercase tracking-widest shadow-xl">
                Report a Stray <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
              </a>
              <a href="#how-it-works" className="px-8 py-4 bg-transparent text-ink border border-ink/30 hover:bg-ink hover:text-white rounded-full flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest">
                Track Operations
              </a>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
