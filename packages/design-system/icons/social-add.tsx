import type { FC } from 'react';

const SocialAdd: FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width="20"
      height="20"
      x="0"
      y="0"
      viewBox="0 0 24 24"
      xmlSpace="preserve"
      className="fill-secondary-foreground"
    >
      <g>
        <path
          fillRule="evenodd"
          d="M17 6A5 5 0 1 1 7 6a5 5 0 0 1 10 0zm-7 7a7 7 0 0 0-7 7 3 3 0 0 0 3 3h7.41c.431 0 .677-.528.453-.898A5.972 5.972 0 0 1 13 19a5.993 5.993 0 0 1 2.56-4.917c.364-.255.333-.839-.101-.93-.47-.1-.959-.153-1.459-.153zm9 2a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 0 1-2 0v-2h-2a1 1 0 1 1 0-2h2v-2a1 1 0 0 1 1-1z"
          clipRule="evenodd"
          opacity="1"
          data-original="#000000"
          className={className}
        />
      </g>
    </svg>
  );
};

export default SocialAdd;
