interface LineSvgProps {
  className: string;
  direction?: 'horizontal' | 'vertical';
}

export default function LineSvg({
  className,
  direction = 'horizontal',
}: LineSvgProps) {
  const isVertical = direction === 'vertical';
  const patternId = isVertical ? ':vertical:' : ':horizontal:';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none">
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={isVertical ? '1' : '16'}
          height={isVertical ? '16' : '1'}
        >
          <line
            className="stroke-zinc-950 dark:stroke-white"
            x1={isVertical ? '0.5' : '0'}
            x2={isVertical ? '0.5' : '16'}
            y1={isVertical ? '0' : '0.5'}
            y2={isVertical ? '16' : '0.5'}
            strokeDasharray="2 2"
            strokeWidth="1.5"
            strokeOpacity="0.1"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
