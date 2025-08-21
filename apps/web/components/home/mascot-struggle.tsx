'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Balancer from 'react-wrap-balancer';

export function MascotStruggle() {
  const struggles = [
    {
      image: '/images/delulu/drowing-in-tabs.png',
      title: 'Six logins, zero patience',
      description:
        'Facebook, Instagram, LinkedIn, TikTok, Twitter, Pinterest... each with their own special upload flow. And you wonder why you never post.',
    },
    {
      image: '/images/delulu/socials.png',
      title: 'Post here. Post there. Post everywhere. Cry a little.',
      description:
        'Same content, different sizes, different captions, different hashtags. Your afternoon just disappeared into the content creation void.',
    },
    {
      image: '/images/delulu/laptop.png',
      title: 'Forgot to post. Again.',
      description:
        "Your brilliant content sits in drafts while your audience forgets you exist. Consistency? What's that? Your algorithm ranking is crying.",
    },
  ];

  return (
    <section className="relative flex w-full flex-col items-center justify-center border-border border-y px-5 md:px-10">
      <div className="relative mx-5 border-border border-x md:mx-10">
        {/* Left diagonal pattern */}
        <div className="-left-4 md:-left-14 absolute top-0 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:w-14" />

        {/* Right diagonal pattern */}
        <div className="-right-4 md:-right-14 absolute top-0 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:w-14" />
        {/* Content */}
        <div className="h-full w-full border-border border-b p-10 md:p-14">
          {/* Section Header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl"
            >
              <Balancer>
                Let's be real. You didn't become a creator just to babysit a
                calendar.
              </Balancer>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="mt-6 text-lg text-muted-foreground leading-8"
            >
              <Balancer>
                Here's the daily nightmare every content creator knows by heart:
              </Balancer>
            </motion.p>
          </div>

          {/* Struggle Cards */}
          <div className="mx-auto grid max-w-2xl grid-cols-1 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {struggles.map((struggle, index) => (
              <motion.div
                key={struggle.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative rounded-xl border border-border bg-card/50 p-8 text-center transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:shadow-lg"
              >
                {/* Mascot Image */}
                <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Image
                      src={struggle.image}
                      alt={struggle.title}
                      width={128}
                      height={128}
                      className="h-full w-full object-contain dark:invert"
                    />
                  </motion.div>
                </div>

                {/* Content */}
                <h3 className="mb-4 font-semibold text-foreground text-lg">
                  <Balancer>{struggle.title}</Balancer>
                </h3>
                <p className="text-muted-foreground text-sm leading-6">
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
            <p className="font-medium text-foreground text-xl">
              <Balancer>
                Yeah... we built Delulu Social so Ghost (and you) don't have to
                live like this.
              </Balancer>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
