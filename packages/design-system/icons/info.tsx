import type { FC } from "react";

const Info: FC = () => {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="fill-[#8E93A5] text-xl transition-all"
        cx="12"
        cy="12"
        r="10"
      />
      <path
        className="fill-[#1C274C] text-xl transition-all"
        clipRule="evenodd"
        d="M12 11C12.5523 11 13 11.4477 13 12V17.0009C13 17.5532 12.5523 18.0009 12 18.0009C11.4477 18.0009 11 17.5532 11 17.0009V12C11 11.4477 11.4477 11 12 11Z"
        fillRule="evenodd"
      />
      <circle
        className="fill-[#1C274C] text-xl transition-all"
        cx="12"
        cy="8"
        r="1"
      />
    </svg>
  );
};

export default Info;
