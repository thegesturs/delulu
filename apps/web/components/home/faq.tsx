"use client";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const faqs = [
  {
    question: "Do I need to connect all my accounts?",
    answer:
      "No. But if you enjoy manually uploading to six different apps every morning, go for it. We support Instagram, TikTok, LinkedIn, YouTube, Twitter, Facebook, Pinterest, and Threads. Connect what you want, ignore what you don't.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Bro, yes. We don't want your embarrassing drafts either. We use OAuth (the fancy secure login thing), never store passwords, and you can revoke access anytime. Your content stays yours.",
  },
  {
    question: "What if I'm just one random creator?",
    answer:
      "Perfect. You'll save even more time than the \"big agencies.\" One person juggling 5 platforms? That's exactly who we built this for. Less tab-switching, more creating.",
  },
  {
    question: "Do you post automatically or just remind me?",
    answer:
      "Automatic. Reminders are for your mom. Schedule once, and we'll post at the perfect time while you sleep, work, or touch grass. No babysitting required.",
  },
  {
    question: "Wait, this really replaces ManyChat?",
    answer:
      "For Instagram DM automation? Yes. Someone comments a keyword \u2192 we send them a DM with your link, automatically. We even reply to their comment. ManyChat charges $67/mo for their pro plan. We include it at $9.99. Same triggers, same automations, fraction of the price.",
  },
  {
    question: "How is this so cheap?",
    answer:
      "We're early. Current pricing is locked in for our first 50 users. We're not trying to be the most expensive tool in your stack \u2014 we're trying to be the only one you need.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yep. Try it. Hate it. Leave. Or stay forever. No hard feelings. Free gets you 1 platform and 10 posts/month. Paid plans unlock way more — and the Vibe plan at $9.99/mo gives you unlimited everything.",
  },
  {
    question: "How many posts can I schedule?",
    answer:
      "Free: 10 posts/month (which is honestly plenty for testing)\n\nEcho ($4.99/mo): 30 posts/month across 5 platforms\n\nVibe ($9.99/mo): Unlimited posts, unlimited platforms\n\nWe count by unique content, not platforms. 1 post shared to 5 platforms = 1 post in our system. Much more generous than other tools.",
  },
  {
    question: "What content types do you support?",
    answer:
      "Videos, images, carousels, text posts, GIFs... basically everything except your existential crisis tweets (though we won't judge). Platform formatting happens automatically.",
  },
  {
    question: "Will this hurt my organic reach?",
    answer:
      "Nope. We use official APIs, so platforms treat your content exactly like native posts. No algorithmic penalties for being smart about your time.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Obviously. No contracts, no guilt trips, no \"please don't leave us\" emails. Cancel in one click, and we'll even help you export your data if you want.",
  },
  {
    question: "What if something breaks?",
    answer:
      "Email us at swaraj@gesturs.com and we'll fix it. Usually within 6-12 hours, sometimes faster if it's really broken. We actually respond to support emails.",
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
            Let's be real. You have{" "}
            <span className="text-primary">questions</span>.
          </h2>
          <p className="mx-auto max-w-3xl text-muted-foreground">
            Here are the answers before you stress about them:
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 rounded-[22px] bg-muted p-4">
          {faqs.map((faq, index) => (
            <div
              className="overflow-hidden rounded-[17px] border bg-gradient-to-b from-card via-background to-card shadow-lg"
              key={index}
            >
              <button
                className="flex w-full items-center gap-2 px-6 py-5 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                type="button"
              >
                <motion.div
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Plus className="text-primary" size={20} />
                </motion.div>
                <span className="text-foreground text-lg">{faq.question}</span>
              </button>
              <AnimatePresence mode="sync">
                {openIndex === index && (
                  <motion.div
                    animate="open"
                    className="overflow-hidden px-6"
                    exit="collapsed"
                    initial="collapsed"
                    key={`content-${index}`}
                    variants={{
                      open: {
                        height: "auto",
                        opacity: 1,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 40,
                          mass: 1,
                        },
                      },
                      collapsed: {
                        height: 0,
                        opacity: 0,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 40,
                          mass: 1,
                        },
                      },
                    }}
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
