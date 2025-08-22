'use client';
import LineSvg from '@/components/ui/line-svg';
import {
  Card,
  CardContent,
  CardHeader,
} from '@delulu/design-system/components/ui/card';
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
    <section className="relative flex w-full flex-col items-center justify-center">
      <div className="relative mx-14 border-border border-x border-dashed">
        {/* Left diagonal pattern */}
        <div className="-left-4 md:-left-14 absolute top-0 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:w-14" />

        {/* Right diagonal pattern */}
        <div className="-right-4 md:-right-14 absolute top-0 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:w-14" />
        {/* Content */}
        <div className="h-full w-full border-border border-b py-10">
          {/* Section Header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
              <Balancer>
                Let's be real. You didn't become a creator just to babysit a
                calendar.
              </Balancer>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-8">
              <Balancer>
                Here's the daily nightmare every content creator knows by heart:
              </Balancer>
            </p>
          </div>

          {/* Line above cards */}
          <LineSvg className="mb-2 h-px w-full" />

          {/* Struggle Cards */}
          <div className="relative mx-auto grid grid-cols-1 gap-2 px-2 lg:max-w-none lg:grid-cols-3">
            {struggles.map((struggle, index) => (
              <>
                <Card key={struggle.title}>
                  {/* Mascot Image */}
                  <CardHeader className="relative mx-auto mb-6 flex size-60 items-center justify-center">
                    <Image
                      key={struggle.title}
                      src={struggle.image}
                      alt={struggle.title}
                      width={300}
                      height={300}
                      className="h-full w-full object-contain dark:invert"
                    />
                  </CardHeader>

                  {/* Content */}
                  <CardContent>
                    <h3 className="mb-4 font-semibold text-foreground text-lg">
                      <Balancer>{struggle.title}</Balancer>
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6">
                      <Balancer>{struggle.description}</Balancer>
                    </p>
                  </CardContent>
                </Card>

                {/* Responsive separators between cards */}
                {index < struggles.length - 1 && (
                  <>
                    {/* Mobile: horizontal line between cards */}
                    <LineSvg className="my-4 h-px w-full lg:hidden" />

                    {/* Desktop: vertical line between cards - centered in gap */}
                    <LineSvg
                      direction="vertical"
                      className={`-top-2 absolute hidden h-[calc(100%+1rem)] w-px lg:block ${index === 0 ? 'left-[calc(33.333%+1px)]' : 'left-[calc(66.666%-2px)]'}`}
                    />
                  </>
                )}
              </>
            ))}
          </div>

          {/* Line below cards */}
          <LineSvg className="mt-2 h-px w-full" />

          {/* Bottom CTA */}
          <div className="mx-auto mt-16 max-w-2xl text-center">
            <p className="font-medium text-foreground text-xl">
              <Balancer>
                Yeah... we built Delulu Social so Ghost (and you) don't have to
                live like this.
              </Balancer>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
