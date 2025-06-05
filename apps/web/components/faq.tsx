'use client';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

const faqs = [
  {
    question: 'What social platforms do you support?',
    answer:
      'We currently support scheduling (and instant posting) to LinkedIn, YouTube, and TikTok. Instagram, Threads, and Twitter integration are coming soon! For feature requests or questions, feel free to reach out to us at swaraj@gesturs.com.',
  },
  {
    question: 'How many social accounts can I connect?',
    answer:
      'Free: Up to 2 platforms\n\nStarter ($12/mo): Up to 5 connected social accounts\n\nCreator ($19.99/mo): Up to 15 connected social accounts\n\nPro ($29.99/mo): Unlimited connected accounts\n\nEach "social account" counts as one connected profile (e.g., one LinkedIn page = one account).',
  },
  {
    question: 'Can I connect multiple accounts on the same platform?',
    answer:
      'Yes. For example:\n\nOn Starter, you could connect 3 TikTok accounts and 2 LinkedIn accounts (total = 5).\n\nOn Creator, you could connect 8 LinkedIn accounts, 4 TikTok accounts, and 3 YouTube channels (total = 15).',
  },
  {
    question: 'How many posts can I schedule each month?',
    answer:
      'Free: Up to 15 scheduled posts per month\n\nPaid plans (Starter, Creator, Pro): Unlimited posts\n\nImportantly, we count posts based on unique content, not platforms:\n• If you create 1 post and share it to 5 platforms, that counts as 1 post\n• If you create 4 different posts and share each to 5 platforms (20 total shares), that counts as 4 posts\n\nThis makes our counting system much more generous than other tools!',
  },
  {
    question: 'What types of content can I post?',
    answer:
      "You can create and schedule:\n\n• Videos (MP4, MOV, etc.)\n• Images (JPG, PNG, GIF)\n• Text-only posts (e.g., LinkedIn article-style)\n• Carousel posts (multiple images)\n\nEach platform's formatting rules are handled automatically—you don't need to manually resize or reformat.",
  },
  {
    question:
      'Will my posts get less organic reach when published through Delulu?',
    answer:
      "No. We use each platform's official API to publish—your content is treated exactly like any native post. There's no penalty for using a scheduling tool.",
  },
  {
    question: 'How secure is my account? Do I need to share passwords?',
    answer:
      "We never store your passwords directly.\n\nWe use each platform's official OAuth (secure authentication flow).\n\nYou log in on the platform's own page, then grant Delulu permission.\n\nYou can revoke access at any time—no data or credentials are ever stored in plain text.",
  },
  {
    question: 'What if I need help?',
    answer:
      'Our team actively monitors feedback channels and responds within 6–12 hours. Your suggestions and bug reports go directly into our product roadmap. We prioritize our first 100 users above everyone else.',
  },
  {
    question: 'What features are included in each plan?',
    answer:
      'Free: Up to 2 platforms, 15 scheduled posts/month\n\nStarter ($12/mo): 5 social accounts, unlimited posts, multiple accounts per platform, carousel posts\n\nCreator ($19.99/mo): 15 social accounts, all Starter features plus content studio access\n\nPro ($29.99/mo): Unlimited accounts, all Creator features',
  },
  {
    question: 'Can I cancel or downgrade at any time?',
    answer:
      "Absolutely. There's no lock-in:\n\n• Cancel or downgrade any time from your account settings\n• Your subscription runs through the end of your current billing cycle\n• No early-cancellation fees",
  },
  {
    question: 'I have another question—how can I reach you?',
    answer:
      'Feel free to email us anytime at swaraj@gesturs.com. We aim to respond within 6–12 hours on weekdays.',
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
            Frequently <span className="text-primary">Asked</span> Questions
          </h2>
          <p className="mx-auto max-w-3xl text-muted-foreground">
            Get answers to common questions about Gesturs' social media
            scheduling platform.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 rounded-[22px] bg-muted p-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[17px] border bg-gradient-to-b from-card via-background to-card shadow-lg"
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
                  <Plus size={20} className="text-primary" />
                </motion.div>
                <span className="text-foreground text-lg">{faq.question}</span>
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
                      <p className="whitespace-pre-line text-muted-foreground">
                        {faq.answer}
                      </p>
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
