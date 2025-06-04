'use client';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

const faqs = [
  {
    question: 'What is the purpose of this website?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla porttitor massa vel ultrices commodo.',
  },
  {
    question: 'What is the purpose of this website?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla porttitor massa vel ultrices commodo.',
  },
  {
    question: 'What is the purpose of this website?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla porttitor massa vel ultrices commodo.',
  },
  {
    question: 'What is the purpose of this website?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla porttitor massa vel ultrices commodo.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="w-full py-20">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-semibold text-4xl">
            Frequently <span className="text-[#FF6B2B]">Asked</span> Questions
          </h2>
          <p className="mx-auto max-w-3xl text-neutral-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
            porttitor massa vel ultrices commodo. Suspendisse varius risus
            scelerisque, accumsan felis vel, sodales erat. Donec tristi
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 rounded-[22px] bg-[#DCDCDC] p-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[17px] border border-[#EBEBEB] bg-gradient-to-b from-[#F6F6F6] via-[#FDFDFD] to-[#F6F6F6] shadow-[0px_95px_27px_0px_rgba(0,0,0,0.00),_0px_61px_24px_0px_rgba(0,0,0,0.03),_0px_34px_21px_0px_rgba(0,0,0,0.11),_0px_15px_15px_0px_rgba(0,0,0,0.19),_0px_4px_8px_0px_rgba(0,0,0,0.22)]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center gap-2 px-6 py-5 text-left"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Plus size={20} className="text-[#FF6B2B]" />
                </motion.div>
                <span className="text-lg text-neutral-800">{faq.question}</span>
              </button>
              <AnimatePresence mode="sync">
                {openIndex === index && (
                  <motion.div
                    key={`content-${index}`}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: {
                        height: 'auto',
                        opacity: 1,
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 40,
                          mass: 1,
                        },
                      },
                      collapsed: {
                        height: 0,
                        opacity: 0,
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 40,
                          mass: 1,
                        },
                      },
                    }}
                    className="overflow-hidden px-6"
                  >
                    <div className="pb-5">
                      <p className="text-neutral-600">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
