"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Balancer from "react-wrap-balancer";

export function MascotSocialProof() {
  const testimonials = [
    {
      quote:
        "I literally cut my posting time from 2 hours a day to 15 minutes. More time to actually, idk, live?",
      author: "Sarah M.",
      role: "Content Creator",
      rating: 5,
      mascot: "/images/delulu/happy.png",
    },
    {
      quote:
        "Delulu Social is my unpaid intern. But like… one that doesn't ghost me.",
      author: "Jay K.",
      role: "Small Business Owner",
      rating: 5,
      mascot: "/images/delulu/shill.png",
    },
    {
      quote:
        "Our team doubled output without adding new hires. My boss thinks I'm a wizard. I'm not correcting him.",
      author: "Anil P.",
      role: "Marketing Manager",
      rating: 5,
      mascot: "/images/delulu/win.png",
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: rating }, (_, i) => (
      <span className="text-yellow-400" key={i}>
        ⭐
      </span>
    ));
  };

  return (
    <section className="relative flex w-full flex-col items-center justify-center border-border border-y px-5 md:px-10">
      <div className="relative mx-5 border-border border-x md:mx-10">
        {/* Left diagonal pattern */}
        <div className="absolute top-0 -left-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-left-14 md:w-14" />

        {/* Right diagonal pattern */}
        <div className="absolute top-0 -right-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-right-14 md:w-14" />

        {/* Content */}
        <div className="h-full w-full border-border border-b p-10 md:p-14">
          {/* Section Header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <motion.h2
              className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Balancer>Don't Take Our Word For It</Balancer>
            </motion.h2>
            <motion.p
              className="mt-6 text-lg text-muted-foreground leading-8"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Balancer>
                Here's what people who actually use this thing are saying:
              </Balancer>
            </motion.p>
          </div>

          {/* Testimonials Grid */}
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                className="flex flex-col items-center rounded-xl border border-border bg-card/50 p-8 text-center transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                key={testimonial.author}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {/* Rating Stars */}
                <div className="mb-6 flex gap-1">
                  {renderStars(testimonial.rating)}
                </div>

                {/* Quote */}
                <blockquote className="mb-6 font-medium text-base text-foreground leading-7">
                  <Balancer>"{testimonial.quote}"</Balancer>
                </blockquote>

                {/* Mascot */}
                <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
                  <motion.div
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Image
                      alt="Happy customer mascot"
                      className="h-full w-full object-contain dark:invert"
                      height={64}
                      src={testimonial.mascot}
                      width={64}
                    />
                  </motion.div>
                </div>

                {/* Author Info */}
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            className="mx-auto mt-16 max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="mb-6 text-lg text-muted-foreground">
              <Balancer>
                Join 10,000+ creators who stopped fighting with upload buttons
                and started actually creating.
              </Balancer>
            </p>
            <motion.div
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              👉 Alright, I'm convinced
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
