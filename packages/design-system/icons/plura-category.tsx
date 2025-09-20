import type { FC } from 'react';

const PluraCategory: FC = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="8"
        height="8"
        rx="3"
        className={' fill-[#1C274C] text-xl transition-all'}
      />
      <rect
        x="3"
        y="13"
        width="8"
        height="8"
        rx="3"
        className={' fill-[#1C274C] text-xl transition-all'}
      />
      <rect
        x="13"
        y="3"
        width="8"
        height="8"
        rx="3"
        className={' fill-[#8E93A5] text-xl transition-all'}
      />
      <rect
        x="13"
        y="13"
        width="8"
        height="8"
        rx="3"
        className={' fill-[#8E93A5] text-xl transition-all'}
      />
    </svg>
  );
};

export default PluraCategory;
