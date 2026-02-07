"use client";
import Image from "next/image";

interface IphoneMockupProps {
  image?: string;
  children?: React.ReactNode;
}

export const IphoneMockup = ({ image, children }: IphoneMockupProps) => {
  return (
    <div className="relative mx-auto h-[600px] w-[300px] md:h-[680px] md:w-[340px]">
      {/* iPhone frame */}
      <div className="absolute inset-0 rounded-[50px] border-[14px] border-black bg-black shadow-xl">
        {/* Dynamic Island */}
        <div className="absolute top-[0.5rem] left-1/2 z-10 h-[1.8rem] w-[6rem] -translate-x-1/2 rounded-full bg-black">
          <div className="absolute top-1/2 right-3 h-[0.6rem] w-[0.6rem] -translate-y-1/2 rounded-full bg-[#1a1a1a] ring-[#2a2a2a] ring-[1.5px]">
            <div className="absolute inset-[1.5px] rounded-full bg-[#0f0f0f]">
              <div className="absolute inset-[1.5px] rounded-full bg-[#151515] ring-[#202020] ring-[0.75px]" />
            </div>
          </div>
        </div>
        {/* Status icons */}
        <div className="absolute inset-0 top-[0.5rem] z-20 flex h-[1.8rem] items-center justify-between px-4 text-[0.65rem] text-black">
          {/* Time */}
          <span className="font-medium text-[0.9rem]">9:41</span>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <svg
              fill="none"
              height="13"
              viewBox="0 0 20 13"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M19.2 1.72656C19.2 1.10524 18.7224 0.601562 18.1333 0.601562H17.0667C16.4776 0.601562 16 1.10524 16 1.72656V11.4766C16 12.0979 16.4776 12.6016 17.0667 12.6016H18.1333C18.7224 12.6016 19.2 12.0979 19.2 11.4766V1.72656ZM11.7659 3H12.8326C13.4217 3 13.8992 3.51577 13.8992 4.152V11.448C13.8992 12.0842 13.4217 12.6 12.8326 12.6H11.7659C11.1768 12.6 10.6992 12.0842 10.6992 11.448V4.152C10.6992 3.51577 11.1768 3 11.7659 3ZM7.43411 5.60156H6.36745C5.77834 5.60156 5.30078 6.1239 5.30078 6.76823V11.4349C5.30078 12.0792 5.77834 12.6016 6.36745 12.6016H7.43411C8.02322 12.6016 8.50078 12.0792 8.50078 11.4349V6.76823C8.50078 6.1239 8.02322 5.60156 7.43411 5.60156ZM2.13333 8H1.06667C0.477563 8 0 8.51487 0 9.15V11.45C0 12.0851 0.477563 12.6 1.06667 12.6H2.13333C2.72244 12.6 3.2 12.0851 3.2 11.45V9.15C3.2 8.51487 2.72244 8 2.13333 8Z"
                fill="black"
                fillRule="evenodd"
              />
            </svg>
            <svg
              fill="none"
              height="13"
              viewBox="0 0 18 13"
              width="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M9.27052 3.11983C11.7576 3.11993 14.1496 4.02494 15.9521 5.6478C16.0879 5.77309 16.3048 5.77151 16.4385 5.64426L17.736 4.40419C17.8037 4.33964 17.8414 4.25222 17.8409 4.16125C17.8403 4.07029 17.8015 3.98328 17.733 3.9195C13.002 -0.374207 5.53829 -0.374207 0.807275 3.9195C0.738743 3.98324 0.699859 4.07021 0.699227 4.16118C0.698595 4.25214 0.736267 4.3396 0.803908 4.40419L2.10177 5.64426C2.23537 5.7717 2.45249 5.77328 2.58814 5.6478C4.39088 4.02483 6.78317 3.11982 9.27052 3.11983ZM9.26717 7.26377C10.6245 7.26369 11.9334 7.76595 12.9395 8.67297C13.0756 8.80169 13.2899 8.7989 13.4226 8.66668L14.7099 7.3718C14.7777 7.30388 14.8153 7.21174 14.8143 7.116C14.8133 7.02025 14.7738 6.92889 14.7047 6.86236C11.6408 4.02505 6.8961 4.02505 3.83227 6.86236C3.76306 6.92889 3.72357 7.0203 3.72266 7.11607C3.72176 7.21185 3.7595 7.30398 3.82744 7.3718L5.11435 8.66668C5.247 8.7989 5.46136 8.80169 5.59745 8.67297C6.6029 7.76655 7.91074 7.26433 9.26717 7.26377ZM11.7916 10.0035C11.7935 10.1069 11.7565 10.2066 11.6892 10.279L9.51249 12.6883C9.44868 12.7591 9.36169 12.799 9.27092 12.799C9.18015 12.799 9.09316 12.7591 9.02935 12.6883L6.85232 10.279C6.78507 10.2065 6.74808 10.1068 6.75007 10.0034C6.75206 9.90002 6.79287 9.8021 6.86286 9.73279C8.25296 8.44324 10.2889 8.44324 11.679 9.73279C11.7489 9.80216 11.7897 9.90011 11.7916 10.0035Z"
                fill="black"
                fillRule="evenodd"
              />
            </svg>
            <svg
              fill="none"
              height="14"
              viewBox="0 0 28 14"
              width="28"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                fill="black"
                height="12"
                opacity="0.35"
                rx="3.8"
                stroke="white"
                width="24"
                x="0.699219"
                y="0.601562"
              />
              <path
                d="M26.0977 4.76953V8.76953C26.9024 8.43075 27.4257 7.64266 27.4257 6.76953C27.4257 5.8964 26.9024 5.10831 26.0977 4.76953Z"
                fill="black"
                opacity="0.4"
              />
              <rect
                fill="black"
                height="9"
                rx="2.5"
                width="21"
                x="2"
                y="2.10156"
              />
            </svg>
          </div>
        </div>

        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[35px] bg-white">
          <div className="absolute inset-0 top-[2.3rem]">
            {image && (
              <Image
                alt="App screenshot"
                className="object-cover"
                fill
                priority
                src={image}
              />
            )}
            {children}
          </div>
        </div>
      </div>

      {/* Side Buttons */}
      <div className="absolute top-[170px] -right-[2px] h-12 w-[3px] rounded-l-lg bg-black" />
      <div className="absolute top-[120px] -left-[2px] h-12 w-[3px] rounded-r-lg bg-black" />
      <div className="absolute top-[170px] -left-[2px] h-14 w-[3px] rounded-r-lg bg-black" />
    </div>
  );
};
