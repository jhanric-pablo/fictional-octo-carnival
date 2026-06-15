import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export default function TechExplain() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-60%"]);

  return (
    <section ref={targetRef} id="tech-explain" style={{ position: 'relative' }} className="relative h-[300vh] bg-paper">
      
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        
        {/* Intro text on the left */}
        <div className="absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-ink">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="font-serif text-[10vw] font-medium leading-[0.8] tracking-tight whitespace-nowrap"
          >
            Rescue <br/> <span className="italic">Ecosystem</span>
          </motion.h2>
        </div>

        {/* Horizontal scroll container */}
        <motion.div style={{ x }} className="flex gap-12 lg:gap-24 pl-[60vw] pr-[20vw] items-center relative z-20">
          
          {/* Card 1 */}
          <div className="w-[80vw] md:w-[40vw] shrink-0 bg-ink text-paper p-12 md:p-16 rounded-[2vw] shadow-2xl flex flex-col justify-between h-[60vh]">
            <div className="font-mono text-xs opacity-50 uppercase tracking-[0.3em]">
              01 // Spatial Mapping
            </div>
            <div>
              <h3 className="text-4xl lg:text-5xl font-serif mb-6">Spatial Intelligence</h3>
              <p className="text-paper/70 text-lg leading-relaxed font-light">
                Our platform uses advanced <strong>Real-time Data Processing</strong> to map stray animal populations across Parañaque. We visualize hotspots and movement patterns to deploy rescue units where they are needed most, ensuring no soul is left behind in the shadows.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="w-[80vw] md:w-[40vw] shrink-0 bg-primary text-paper p-12 md:p-16 rounded-[2vw] shadow-2xl flex flex-col justify-between h-[60vh]">
            <div className="font-mono text-xs opacity-80 uppercase tracking-[0.3em] text-white/75">
              02 // Dispatch Sync
            </div>
            <div>
              <h3 className="text-4xl lg:text-5xl font-serif mb-6">Rapid Response Sync</h3>
              <p className="text-paper/80 text-lg leading-relaxed font-light">
                Every second counts in a rescue emergency. Our <strong>Frictionless Alert System</strong> ensures that community sightings are transmitted instantly to our dispatchers with precision geolocation, bridging the gap between a report and a safe arrival.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="w-[80vw] md:w-[40vw] shrink-0 bg-paper-alt text-ink border border-border p-12 md:p-16 rounded-[2vw] shadow-2xl flex flex-col justify-between h-[60vh]">
            <div className="font-mono text-xs opacity-50 uppercase tracking-[0.3em]">
              03 // Public Registry
            </div>
            <div>
              <h3 className="text-4xl lg:text-5xl font-serif mb-6">Impact Visualization</h3>
              <p className="text-ink-muted text-lg leading-relaxed font-light">
                We use <strong>Transparent Data Tracking</strong> to showcase the full journey of our rescues. From the initial street encounter to successful rehabilitation and adoption, we document every success story to inspire a more compassionate city.
              </p>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
