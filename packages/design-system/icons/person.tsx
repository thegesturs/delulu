import type { FC } from "react";

const Person: FC = () => {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className={"fill-[#8E93A5] text-xl transition-all dark:fill-gray-700"}
        cx="12"
        cy="7"
        r="5"
      />
      <path
        className={"fill-[#1C274C] text-xl transition-all dark:fill-gray-400"}
        d="M3 19V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V19C21 16.2386 18.7614 14 16 14H8C5.23858 14 3 16.2386 3 19Z"
      />
    </svg>
  );
};

export default Person;
