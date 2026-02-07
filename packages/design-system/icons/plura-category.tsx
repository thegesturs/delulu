import type { FC } from "react";

const PluraCategory: FC = () => {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        className={"fill-[#1C274C] text-xl transition-all"}
        height="8"
        rx="3"
        width="8"
        x="3"
        y="3"
      />
      <rect
        className={"fill-[#1C274C] text-xl transition-all"}
        height="8"
        rx="3"
        width="8"
        x="3"
        y="13"
      />
      <rect
        className={"fill-[#8E93A5] text-xl transition-all"}
        height="8"
        rx="3"
        width="8"
        x="13"
        y="3"
      />
      <rect
        className={"fill-[#8E93A5] text-xl transition-all"}
        height="8"
        rx="3"
        width="8"
        x="13"
        y="13"
      />
    </svg>
  );
};

export default PluraCategory;
