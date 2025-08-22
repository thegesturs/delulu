import LineSvg from '@/components/ui/line-svg';
import {
  Card,
  CardContent,
  CardHeader,
} from '@delulu/design-system/components/ui/card';
import Image from 'next/image';
import Balancer from 'react-wrap-balancer';

export function MascotBenefits() {
  const benefits = [
    {
      image: '/images/delulu/calendar.png',
      title: 'Time thief, arrested.',
      subtitle: 'Write once. Post everywhere. Done.',
      description:
        "No more tab-hopping Olympics. Create your content once, and we'll format it perfectly for every platform. Your sanity will thank you.",
      badge: 'Efficiency Era',
    },
    {
      image: '/images/delulu/happy.png',
      title: 'Consistency without crying.',
      subtitle: "Schedule ahead. Pretend you're organized.",
      description:
        "Queue up a week's worth of posts in 15 minutes. Your audience thinks you're a posting machine. Win-win.",
      badge: 'Main Character',
    },
    {
      image: '/images/delulu/shill.png',
      title: 'More sleep. Less doomscroll guilt.',
      subtitle: 'Auto-posting while you actually live your life.',
      description:
        'Because posting at midnight just to hit "optimal time" is so 2022. Set it, forget it, touch grass.',
      badge: 'Self Care Win',
    },
    {
      image: '/images/delulu/win.png',
      title: 'All your chaos, one dashboard.',
      subtitle: 'Instagram, TikTok, LinkedIn, YouTube, Threads...',
      description:
        'All tucked in like messy little kids in one bed. One login, one interface, zero headaches.',
      badge: 'CEO Mode',
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
          <div className="mx-auto mb-20 max-w-2xl text-center">
            <h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
              <Balancer>How We Fixed Your Posting Nightmare</Balancer>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-8">
              <Balancer>
                Let's be real. You didn't become a creator/entrepreneur/marketer
                just to babysit a calendar and fight with upload buttons.
              </Balancer>
            </p>
          </div>

          {/* Line above cards */}
          <LineSvg className="mb-2 h-px w-full" />

          {/* Benefits Grid */}
          <div className="relative mx-auto grid max-w-2xl grid-cols-1 gap-2 px-2 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {benefits.map((benefit, index) => (
              <>
                <Card
                  key={benefit.title}
                  className="group relative transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:shadow-lg"
                >
                  {/* Mascot Image */}
                  <CardHeader className="relative mx-auto mb-6 flex size-60 items-center justify-center lg:mx-0">
                    <Image
                      src={benefit.image}
                      alt={benefit.title}
                      width={128}
                      height={128}
                      className="h-full w-full object-contain dark:invert"
                    />
                  </CardHeader>

                  {/* Content */}
                  <CardContent className="text-center lg:text-left">
                    <div className="mb-3">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
                        {benefit.badge}
                      </span>
                    </div>

                    <h3 className="mb-2 font-bold text-foreground text-xl">
                      <Balancer>{benefit.title}</Balancer>
                    </h3>

                    <p className="mb-3 font-medium text-base text-primary">
                      <Balancer>{benefit.subtitle}</Balancer>
                    </p>

                    <p className="text-muted-foreground text-sm leading-6">
                      <Balancer>{benefit.description}</Balancer>
                    </p>
                  </CardContent>
                </Card>

                {/* Responsive separators between cards */}
                {index < benefits.length - 1 && (
                  <>
                    {/* Mobile: horizontal line between cards */}
                    <LineSvg className="my-4 h-px w-full lg:hidden" />
                  </>
                )}

                {/* Desktop: vertical line between columns (after cards 0,2) */}
                {(index === 0 || index === 2) && (
                  <LineSvg
                    direction="vertical"
                    className="-top-2 absolute left-1/2 hidden h-[calc(100%+1rem)] w-px lg:block"
                  />
                )}

                {/* Desktop: horizontal line between rows (after card 1) */}
                {index === 1 && (
                  <LineSvg className="absolute top-1/2 left-0 hidden h-px w-full lg:block" />
                )}
              </>
            ))}
          </div>

          {/* Line below cards */}
          <LineSvg className="mt-2 h-px w-full" />

          {/* Bottom Quote */}
          <div className="mx-auto mt-20 max-w-3xl text-center">
            <blockquote className="font-medium text-foreground text-xl">
              <Balancer>
                "You could keep wasting hours posting the old way... or just let
                us do it for you."
              </Balancer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
