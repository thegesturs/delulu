import type { FC } from "react";

const Home: FC = () => {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="fill-[#1C274C] text-xl transition-all dark:fill-gray-400"
        clipRule="evenodd"
        d="M2 11.3361C2 10.4856 2.36096 9.67515 2.99311 9.10622L9.9931 2.80622C11.134 1.7794 12.866 1.7794 14.0069 2.80622L21.0069 9.10622C21.639 9.67515 22 10.4856 22 11.3361V19C22 20.6569 20.6569 22 19 22H16L15.9944 22H8.00558L8 22H5C3.34315 22 2 20.6569 2 19V11.3361Z"
        fillRule="evenodd"
      />
      <path
        className="fill-[#8E93A5] text-xl transition-all dark:fill-gray-700"
        d="M9 16C9 14.8954 9.89543 14 11 14H13C14.1046 14 15 14.8954 15 16V22H9V16Z"
      />
    </svg>
  );
};

export default Home;
