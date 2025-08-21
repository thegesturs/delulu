'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import type React from 'react';
import Balancer from 'react-wrap-balancer';

export function MascotStruggle() {
  const struggles = [
    {
      image: '/images/delulu/drowing-in-tabs.png',
      title: 'Six logins, zero patience',
      description: 'Facebook, Instagram, LinkedIn, TikTok, Twitter, Pinterest... each with their own special upload flow. And you wonder why you never post.',
    },
    {
      image: '/images/delulu/socials.png', 
      title: 'Post here. Post there. Post everywhere. Cry a little.',
      description: 'Same content, different sizes, different captions, different hashtags. Your afternoon just disappeared into the content creation void.',
    },
    {
      image: '/images/delulu/laptop.png',
      title: 'Forgot to post. Again.',
      description: 'Your brilliant content sits in drafts while your audience forgets you exist. Consistency? What\'s that? Your algorithm ranking is crying.',
    },
  ];

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
              Let's be real. You didn't become a creator just to babysit a calendar.
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
              Here's the daily nightmare every content creator knows by heart:
            </Balancer>
          </motion.p>
        </div>

        {/* Struggle Cards */}
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {struggles.map((struggle, index) => (
            <motion.div
              key={struggle.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl border border-border/50 bg-card/30 p-8 text-center transition-all duration-300 hover:border-border/80 hover:bg-card/50"
            >
              {/* Mascot Image */}
              <div className="relative mb-6 flex h-40 w-40 items-center justify-center mx-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Image
                    src={struggle.image}
                    alt={struggle.title}
                    width={160}
                    height={160}
                    className="h-full w-full object-contain invert dark:invert-0"
                  />
                </motion.div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-4">
                <Balancer>{struggle.title}</Balancer>
              </h3>
              <p className="text-sm text-muted-foreground leading-6">
                <Balancer>{struggle.description}</Balancer>
              </p>
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
          <p className="text-xl font-medium text-foreground">
            <Balancer>
              Yeah... we built Delulu Social so Ghost (and you) don't have to live like this.
            </Balancer>
          </p>
        </motion.div>
      </div>
    </section>
  );
}