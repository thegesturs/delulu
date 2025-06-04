'use client';
import { cn } from '@delulu/design-system/lib/utils';
import Image from 'next/image';
import Balancer from 'react-wrap-balancer';

export function LogoCloud() {
  const logos = [
    {
      name: 'Aceternity UI',
      src: 'https://assets.aceternity.com/pro/logos/aceternity-ui.png',
    },
    {
      name: 'Gamity',
      src: 'https://assets.aceternity.com/pro/logos/gamity.png',
    },
    {
      name: 'Host it',
      src: 'https://assets.aceternity.com/pro/logos/hostit.png',
    },
    {
      name: 'Asteroid Kit',
      src: 'https://assets.aceternity.com/pro/logos/asteroid-kit.png',
    },
  ];

  return (
    <div className="relative w-full overflow-hidden py-12 md:py-4">
      <div className="relative z-20 mx-auto mb-4 max-w-4xl text-balance px-4 text-center font-semibold text-gray-700 text-lg tracking-tight md:text-3xl">
        <Balancer>
          <h2
            className={cn(
              'inline-block text-center font-inter font-semibold text-[#3D3D3D] text-[22px]'
            )}
          >
            Trusted by Industry Leaders
          </h2>
        </Balancer>
      </div>
      <div className="relative mx-auto grid w-full max-w-3xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 md:grid-cols-4 md:gap-10">
        {logos.map((logo, idx) => (
          <div
            key={logo.src + idx}
            className="flex items-center justify-center"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={300}
              height={300}
              className="w-full max-w-[200px] select-none object-contain"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
