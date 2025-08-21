'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import type React from 'react';
import Balancer from 'react-wrap-balancer';

export function MascotSocialProof() {
  const testimonials = [
    {
      quote: "I literally cut my posting time from 2 hours a day to 15 minutes. More time to actually, idk, live?",
      author: "Sarah M.",
      role: "Content Creator",
      rating: 5,
      mascot: '/images/delulu/happy.png',
    },
    {
      quote: "Delulu Social is my unpaid intern. But like… one that doesn't ghost me.",
      author: "Jay K.",
      role: "Small Business Owner", 
      rating: 5,
      mascot: '/images/delulu/shill.png',
    },
    {
      quote: "Our team doubled output without adding new hires. My boss thinks I'm a wizard. I'm not correcting him.",
      author: "Anil P.",
      role: "Marketing Manager",
      rating: 5,
      mascot: '/images/delulu/win.png',
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: rating }, (_, i) => (
      <span key={i} className="text-yellow-400">⭐</span>
    ));
  };

  return (
    <section className="relative bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            <Balancer>
              Social Proof (make it playful)
            </Balancer>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-6 text-lg leading-8 text-muted-foreground"
          >
            <Balancer>
              Don't take our word for it. Here's what people who actually use this thing are saying:
            </Balancer>
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-muted/30 border border-border/50"
            >
              {/* Rating Stars */}
              <div className="flex gap-1 mb-6">
                {renderStars(testimonial.rating)}
              </div>

              {/* Quote */}
              <blockquote className="text-lg font-medium text-foreground mb-6 leading-7">
                <Balancer>
                  "{testimonial.quote}"
                </Balancer>
              </blockquote>

              {/* Mascot */}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Image
                    src={testimonial.mascot}
                    alt="Happy customer mascot"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                </motion.div>
              </div>

              {/* Author Info */}
              <div>
                <div className="font-semibold text-foreground">
                  {testimonial.author}
                </div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mx-auto mt-16 max-w-2xl text-center"
        >
          <p className="text-lg text-muted-foreground mb-6">
            <Balancer>
              Join 10,000+ creators who stopped fighting with upload buttons and started actually creating.
            </Balancer>
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            👉 Alright, I'm convinced
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}