import { Smartphone, Clock, ShieldCheck, Ambulance } from 'lucide-react';
import { motion } from 'motion/react';

const steps = [
  {
    icon: <Smartphone size={32} className="text-primary" />,
    title: "1. Spot & Report",
    description: "Use our mobile-friendly form to drop a pin, upload a photo, and describe the stray's condition."
  },
  {
    icon: <ShieldCheck size={32} className="text-primary" />,
    title: "2. Verification",
    description: "Our system logs the report and cross-references it with existing local records to avoid duplicates."
  },
  {
    icon: <Ambulance size={32} className="text-primary" />,
    title: "3. Dispatch",
    description: "Verified cases are immediately dispatched to the nearest available rescue unit in Parañaque."
  },
  {
    icon: <Clock size={32} className="text-primary" />,
    title: "4. Status Tracking",
    description: "Receive updates via SMS or email regarding the status of your reported stray, from rescue to rehabilitation."
  }
];

export default function Features() {
  return (
    <section id="how-it-works" className="py-24 bg-paper">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-medium tracking-tight mb-6">
            The Smart System
          </h2>
          <p className="text-ink-muted text-lg">
            A modernized approach to animal welfare. Our platform ensures that reports don't get lost in social media feeds, connecting citizens directly to professional rescuers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-[32px] shadow-sm border border-border relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="mb-6 bg-paper-alt w-16 h-16 rounded-2xl flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">{step.title}</h3>
              <p className="text-ink-muted text-sm leading-relaxed">
                {step.description}
              </p>
              
              {/* Decorative number in background */}
              <div className="absolute -right-4 -bottom-8 font-serif font-black text-9xl text-ink opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none">
                {index + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
