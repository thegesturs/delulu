"use client";
import { DM_PLAN_LIMITS } from "@delulu/database/convex/schemas/automations";
import { type CurrencyCode, formatDmLimit, PLANS } from "@delulu/payments";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useCurrency } from "@/hooks/use-currency";

function getFaqs(currency: CurrencyCode) {
  const echo = PLANS.ECHO;
  const vibe = PLANS.VIBE;
  const echoPrice =
    currency === "INR"
      ? `₹${echo.price.INR.monthly}/mo`
      : `$${echo.price.USD.monthly}/mo`;
  const vibePrice =
    currency === "INR"
      ? `₹${vibe.price.INR.monthly}/mo`
      : `$${vibe.price.USD.monthly}/mo`;

  return [
    {
      question: "Do I need to connect all my accounts?",
      answer:
        "No. Instagram is required for auto-DM automations, but you can connect TikTok, LinkedIn, YouTube, Twitter, Facebook, Pinterest, and Threads whenever you want.",
    },
    {
      question: "Is my data safe?",
      answer:
        "Yes. We use official platform APIs with OAuth — we never store your passwords. You can revoke access anytime.",
    },
    {
      question: "Wait, this really replaces ManyChat?",
      answer: `For Instagram DM automation? Yes. Someone comments a keyword → we send them a DM with your link and reply to their comment. ManyChat's pro plan runs $67/mo. Echo (${echoPrice}) includes ${formatDmLimit(DM_PLAN_LIMITS.ECHO)} auto-DMs/month.`,
    },
    {
      question: "Is there a free plan?",
      answer: `No — Delulu is a paid product built for creators who are serious about growth. Plans start at Echo (${echoPrice}). Every plan includes a 14-day money-back guarantee.`,
    },
    {
      question: "How many posts can I schedule?",
      answer: `Echo (${echoPrice}): ${echo.limits.socialAccounts} social accounts, ${echo.limits.monthlyPosts} posts/month, ${formatDmLimit(DM_PLAN_LIMITS.ECHO)} auto-DMs/month\n\nVibe (${vibePrice}): Unlimited social accounts, unlimited posts, ${formatDmLimit(DM_PLAN_LIMITS.VIBE)} auto-DMs/month\n\nWe count by unique content, not platforms. One post to 5 platforms = 1 post.`,
    },
    {
      question: "What content types do you support?",
      answer:
        "Videos, images, carousels, text posts, and GIFs. Platform formatting happens automatically.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. No contracts. Cancel in one click from billing, anytime.",
    },
    {
      question: "What if something breaks?",
      answer:
        "Email swaraj@gesturs.com — we typically respond within 6–12 hours.",
    },
  ];
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const currency = useCurrency();
  const faqs = getFaqs(currency);

  return (
    <section className="w-full py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-semibold text-4xl">
            Let's be real. You have{" "}
            <span className="text-primary">questions</span>.
          </h2>
          <p className="mx-auto max-w-3xl text-muted-foreground">
            Here are the answers before you stress about them:
          </p>
        </div>

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
