interface LineSvgProps {
  className: string;
  direction?: "horizontal" | "vertical";
}

export default function LineSvg({
  className,
  direction = "horizontal",
}: LineSvgProps) {
  const isVertical = direction === "vertical";
  const patternId = isVertical ? ":vertical:" : ":horizontal:";

  return (
    <svg className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          height={isVertical ? "16" : "1"}
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={isVertical ? "1" : "16"}
        >
          <line
            className="stroke-zinc-950 dark:stroke-white"
            strokeDasharray="2 2"
            strokeLinejoin="round"
            strokeOpacity="0.1"
            strokeWidth="1.5"
            x1={isVertical ? "0.5" : "0"}
            x2={isVertical ? "0.5" : "16"}
            y1={isVertical ? "0" : "0.5"}
            y2={isVertical ? "16" : "0.5"}
          />
        </pattern>
      </defs>
      <rect fill={`url(#${patternId})`} height="100%" width="100%" />
    </svg>
  );
}
