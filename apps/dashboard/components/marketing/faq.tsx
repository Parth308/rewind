"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FadeUp } from "../ui/fade-up";

export const FAQ = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <section className="py-32 px-6 max-w-3xl mx-auto">
      <FadeUp>
        <h2 className="font-serif text-4xl text-center text-white mb-12">Frequently Asked Questions</h2>
      </FadeUp>

      <div className="space-y-4">
        {[
          { q: "Is it really free?", a: "The core Rewind engine is 100% open-source and free to self-host forever. We don't restrict features or artificially limit sessions." },
          { q: "How much resources does it need?", a: "Rewind is incredibly lightweight. A standard $6/mo VPS (1GB RAM, 1 vCPU) can easily handle 50,000+ sessions per month." },
          { q: "Does it capture passwords or PII?", a: "By default, Rewind masks all input fields. You can also aggressively mask any specific HTML classes or IDs using the SDK configuration." },
          { q: "Can I deploy it to AWS/GCP?", a: "Yes. Rewind is packaged as a standard Docker container. If it runs Docker, it runs Rewind." }
        ].map((faq, i) => (
          <FadeUp key={i} delay={i * 0.1}>
            <div className="border border-[var(--color-border-dark)] rounded-lg bg-[var(--color-surface)] overflow-hidden">
              <button 
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full text-left px-6 py-4 flex justify-between items-center text-white hover:bg-white/5 transition-colors"
              >
                <span className="font-medium">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 text-neutral-400 text-sm overflow-hidden"
                  >
                    <div className="pb-4 pt-2 border-t border-[var(--color-border-dark)] mt-2">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
};
