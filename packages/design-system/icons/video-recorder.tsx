import type { FC } from "react";

const VideoRecorder: FC = () => {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className={"fill-[#1C274C] text-xl transition-all"}
        d="M18.8375 7.25891L15 10V14L18.8375 16.7411C20.1613 17.6866 22 16.7404 22 15.1136V8.88638C22 7.25963 20.1613 6.31339 18.8375 7.25891Z"
      />
      <rect
        className={"fill-[#8E93A5] text-xl transition-all"}
        height="14"
        rx="3"
        width="15"
        x="2"
        y="5"
      />
    </svg>
  );
};

export default VideoRecorder;
