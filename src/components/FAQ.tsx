import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const faqs = [
  {
    question: "Is this service available outside Parañaque City?",
    answer: "Currently, our direct dispatch system is optimized and partnered exclusively with local government units and partner rescue shelters within Parañaque City to ensure rapid response times."
  },
  {
    question: "What should I do while waiting for the rescue team?",
    answer: "Keep a safe distance, especially if the animal appears afraid or aggressive. Do not attempt to catch or corner the animal. If possible, keep visual contact and inform the team of any changes in location via the tracker link sent to your phone."
  },
  {
    question: "Is the reporting service free?",
    answer: "Yes. Reporting an emergency is completely free. Our platform is subsidized by local partnerships and donations to ensure animal welfare is prioritized above all."
  },
  {
    question: "Can I remain anonymous when reporting?",
    answer: "We require a valid phone number for verification to prevent spam and allow rescuers to contact you for exact coordinates, but your name will not be publicly shared."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" className="py-24 bg-paper border-t border-border">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="font-serif text-3xl md:text-5xl font-medium tracking-tight mb-12 text-center text-ink">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-border overflow-hidden transition-all duration-300"
              >
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none hover:bg-paper-alt/50 transition-colors"
                >
                  <span className="font-serif font-semibold text-lg text-ink">{faq.question}</span>
                  <ChevronDown 
                    className={`text-ink-lighter transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    size={20}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-ink-muted leading-relaxed border-t border-border pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
