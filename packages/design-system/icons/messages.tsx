import type { FC } from "react";

const Message: FC = () => {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="fill-[#1C274C] text-xl transition-all"
        d="M22 13C22 14.6569 20.6569 16 19 16H9C7.34315 16 6 14.6569 6 13V7C6 5.34315 7.34315 4 9 4H16L18.8906 2.07293C20.2197 1.18686 22 2.13964 22 3.73703V13Z"
      />
      <path
        className="fill-[#8E93A5] text-xl transition-all"
        d="M2 11C2 9.34315 3.34315 8 5 8H15C16.6569 8 18 9.34315 18 11V17C18 18.6569 16.6569 20 15 20H7L5.24939 21.4005C3.93986 22.4481 2 21.5158 2 19.8388V11Z"
      />
      <path
        className="fill-[#1C274C] text-xl transition-all"
        clipRule="evenodd"
        d="M6 14C6 13.4477 6.44772 13 7 13H13C13.5523 13 14 13.4477 14 14C14 14.5523 13.5523 15 13 15H7C6.44772 15 6 14.5523 6 14Z"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default Message;
