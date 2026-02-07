"use client";
import { Button } from "@delulu/design-system/components/ui/button";
import { NaturalDatePicker } from "@delulu/design-system/components/ui/natural-date-picker";
import { cn } from "@delulu/design-system/lib/utils";
import { Calendar, Pencil, Share2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

// Message type definition
interface Message {
  role: "assistant" | "user";
  content: string;
}

// Card type definition
interface Card {
  id: number;
  name: string;
  designation: string;
  content: string;
  gradient: string;
}

// Reusable components
const GradientTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-4 font-bold text-4xl">{children}</h2>
);

const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[18px] border border-[#E1E1E1] bg-[#F9FAFB] p-4 shadow-[0px_37px_10px_0px_rgba(0,0,0,0.00),_0px_24px_10px_0px_rgba(0,0,0,0.01),_0px_13px_8px_0px_rgba(0,0,0,0.02),_0px_6px_6px_0px_rgba(0,0,0,0.03),_0px_1px_3px_0px_rgba(0,0,0,0.04)]">
    {children}
  </div>
);

const ContentBox = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "h-[320px] space-y-4 rounded-xl border border-[#E1E1E1] bg-white p-4",
      className
    )}
  >
    {children}
  </div>
);

const SectionTitle = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <>
    <motion.h3
      className="mt-6 mb-2 font-bold text-xl"
      whileHover={{ scale: 1.05 }}
    >
      {title}
    </motion.h3>
    <motion.p
      className="text-gray-500 text-sm leading-relaxed"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
    >
      {description}
    </motion.p>
  </>
);

// Chat Section Component
// const ChatSection = () => {
//   const messages: Message[] = [
//     {
//       role: 'assistant',
//       content: 'Hello, Nice',
//     },
//     {
//       role: 'assistant',
//       content:
//         'Welcome to LiveChat I was made with Pick a topic from the list or type down a question!',
//     },
//     {
//       role: 'user',
//       content: 'Welcome',
//     },
//   ];

//   return (
//     <SectionWrapper>
//       <ContentBox>
//         <div className="space-y-4">
//           {messages.map((message, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3, delay: index * 0.1 }}
//               whileHover={{ scale: 1.02 }}
//               className={`flex ${
//                 message.role === 'user' ? 'justify-end' : 'justify-start'
//               }`}
//             >
//               <motion.div
//                 whileHover={{
//                   scale: 1.05,
//                   boxShadow: '0px 10px 20px -5px rgba(0,0,0,0.2)',
//                 }}
//                 transition={{ type: 'spring', stiffness: 400 }}
//                 className={`max-w-[80%] p-2 text-sm ${
//                   message.role === 'user'
//                     ? 'rounded-[10px_0px_10px_10px] border border-[#E3E3E3] bg-gradient-to-br from-[#FFA756] to-[#EE602C] text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.10),_0px_4px_6px_-4px_rgba(0,0,0,0.10)]'
//                     : 'rounded-[0px_10px_10px_10px] border border-[#E3E3E3] bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.10),_0px_4px_6px_-4px_rgba(0,0,0,0.10)]'
//                 }`}
//               >
//                 {message.content}
//               </motion.div>
//             </motion.div>
//           ))}
//         </div>

//         <motion.div
//           whileHover={{ scale: 1.02 }}
//           className="flex items-center gap-3 rounded-full border border-gray-200 p-3.5"
//         >
//           <input
//             type="text"
//             placeholder="Write a message"
//             className="flex-1 bg-white text-sm placeholder-gray-400 outline-none"
//           />
//           <div className="flex items-center gap-3 text-gray-400">
//             <motion.button
//               whileHover={{ scale: 1.2, rotate: 15 }}
//               className="transition-colors hover:text-gray-600"
//             >
//               <svg
//                 width="20"
//                 height="20"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//               >
//                 <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
//               </svg>
//             </motion.button>
//             <motion.button
//               whileHover={{ scale: 1.2, x: 5 }}
//               className="transition-colors hover:text-gray-600"
//             >
//               <svg
//                 width="20"
//                 height="20"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//               >
//                 <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
//               </svg>
//             </motion.button>
//           </div>
//         </motion.div>
//       </ContentBox>

//       <SectionTitle
//         title="Chat with your calls"
//         description="It makes no sense but we have it here. Use it the way you want it."
//       />
//     </SectionWrapper>
//   );
// };

// // Payment Section Component
// const PaymentSection = () => {
//   const [cards, setCards] = useState<Card[]>([
//     {
//       id: 1,
//       name: 'Credit Card',
//       designation: 'Visa',
//       content: '**** **** **** 2834',
//       gradient: 'from-[#FF7757] to-[#FF5C38]',
//     },
//     {
//       id: 2,
//       name: 'PayPal',
//       designation: 'Connected',
//       content: 'john.doe@email.com',
//       gradient: 'from-[#00457C] to-[#0079C1]',
//     },
//     {
//       id: 3,
//       name: 'Apple Pay',
//       designation: 'Connected',
//       content: 'Connected to iPhone',
//       gradient: 'from-[#000000] to-[#262626]',
//     },
//   ]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCards((prevCards) => {
//         const newArray = [...prevCards];
//         newArray.unshift(newArray.pop()!);
//         return newArray;
//       });
//     }, 5000);

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <SectionWrapper>
//       <ContentBox>
//         <div className="mb-8 text-center">
//           <h2 className="bg-gradient-to-b from-[#333333] via-[#5E5E5E] to-[#000000] bg-clip-text font-bold text-[32px] text-transparent">
//             $12,000
//           </h2>
//           <p className="text-gray-500 text-sm">Total Balance</p>
//         </div>

//         <div className="relative h-48">
//           {cards.map((card, index) => (
//             <motion.div
//               key={card.id}
//               className={`absolute h-[180px] w-full rounded-[20px] bg-gradient-to-br p-6 text-white ${card.gradient}`}
//               style={{
//                 transformOrigin: 'top center',
//               }}
//               animate={{
//                 top: index * -10,
//                 scale: 1 - index * 0.06,
//                 zIndex: cards.length - index,
//               }}
//             >
//               <div className="relative z-10 flex items-center justify-between">
//                 <div className="h-8 w-12 rounded-md bg-gradient-to-r from-yellow-100 to-yellow-50" />
//                 <div className="flex space-x-2">
//                   <div className="h-8 w-8 rounded-full bg-white/20" />
//                   <div className="h-8 w-8 rounded-full bg-white/20" />
//                 </div>
//               </div>
//               <div className="relative z-10 mt-6">
//                 <p className="font-medium text-lg tracking-[0.2em]">
//                   {card.content}
//                 </p>
//                 <div className="mt-3 flex items-center gap-2">
//                   <p className="text-sm opacity-90">{card.name}</p>
//                   <span className="text-sm opacity-75">•</span>
//                   <p className="text-sm opacity-90">{card.designation}</p>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </ContentBox>

//       <SectionTitle
//         title="Easy payments"
//         description="We accept all kinds of cards. We make sure you get money whichever way possible."
//       />
//     </SectionWrapper>
//   );
// };

// Team Section Component
// const TeamSection = () => {
//   return (
//     <SectionWrapper>
//       <ContentBox>
//         <div className="mb-6 flex items-center justify-between">
//           <button
//             type="button"
//             className="font-medium text-[#FF7757] transition-colors hover:text-[#ff6640]"
//           >
//             + Invite
//           </button>
//           <div className="-space-x-3 flex">
//             {[1, 2, 3, 4].map((i) => (
//               <div
//                 key={i}
//                 className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 ring-2 ring-gray-50"
//                 style={{
//                   backgroundImage: `url(https://i.pravatar.cc/150?img=${i})`,
//                   backgroundSize: 'cover',
//                 }}
//               />
//             ))}
//             <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-50 font-medium text-gray-500 text-sm ring-2 ring-gray-50">
//               +2
//             </div>
//           </div>
//         </div>
//         <div className="relative h-52">
//           <motion.div
//             initial={{ opacity: 0, y: 10 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.4 }}
//             className="absolute inset-0 rounded-[10px] border border-[rgba(252,152,78,0.59)] border-dashed bg-[rgba(252,152,78,0.06)] p-5"
//           />
//           <motion.div
//             whileHover={{ rotate: 9 }}
//             transition={{ type: 'spring', stiffness: 300 }}
//             className="absolute inset-0 rounded-[16px] border-[#E0E0E0] border-[0.7px] bg-white p-5 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.10),_0px_4px_6px_-4px_rgba(0,0,0,0.10)]"
//           >
//             <div>
//               <span className="rounded bg-gradient-to-b from-[#FFA756] to-[#EE602C] px-3 py-1 font-medium text-sm text-white">
//                 High
//               </span>
//               <h4 className="mt-3 mb-1 font-semibold text-sm">Research</h4>
//               <p className="text-gray-500 text-xs">
//                 User research helps you to create an optimal product for users.
//               </p>
//             </div>
//             <div className="mt-5 flex flex-col justify-between sm:flex-row sm:items-center">
//               <div className="-space-x-2 flex">
//                 <div
//                   className="h-7 w-7 rounded-full border-2 border-white ring-2 ring-gray-50"
//                   style={{
//                     backgroundImage: 'url(https://i.pravatar.cc/150?img=5)',
//                     backgroundSize: 'cover',
//                   }}
//                 />
//                 <div
//                   className="h-7 w-7 rounded-full border-2 border-white ring-2 ring-gray-50"
//                   style={{
//                     backgroundImage: 'url(https://i.pravatar.cc/150?img=6)',
//                     backgroundSize: 'cover',
//                   }}
//                 />
//               </div>
//               <div className="mt-2 flex items-center gap-4 text-gray-400 text-sm">
//                 <span className="flex items-center gap-1.5 text-xs">
//                   <svg
//                     width="16"
//                     height="16"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//                   </svg>
//                   10 comments
//                 </span>
//                 <span className="flex items-center gap-1.5 text-xs">
//                   <svg
//                     width="16"
//                     height="16"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="M12 20V10M18 20V4M6 20v-4" />
//                   </svg>
//                   3 files
//                 </span>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </ContentBox>

//       <SectionTitle
//         title="Invite team members"
//         description="With our state of the art support of team members, invite your team into the software."
//       />
//     </SectionWrapper>
//   );
// };

// Create Post Section
const CreatePostSection = () => {
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  return (
    <SectionWrapper>
      <ContentBox>
        <motion.div
          className="flex h-full flex-col"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Post Editor</h4>
          </div>
          <motion.div
            animate={{
              rotateY: isPreview ? 180 : 0,
              transition: { duration: 0.5 },
            }}
            className="flex-grow rounded-lg border border-border bg-card/50 p-4 [transform-style:preserve-3d]"
          >
            <div
              className={cn(
                "h-full w-full transition-opacity duration-500",
                isPreview ? "opacity-0" : "opacity-100"
              )}
            >
              <textarea
                className="h-full w-full resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post here..."
                value={content}
              />
            </div>
            <div
              className={cn(
                "absolute inset-0 h-full w-full p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]",
                isPreview ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="prose prose-sm h-full overflow-auto">
                {content || "Nothing to preview yet..."}
              </div>
            </div>
          </motion.div>
          <motion.div
            className="mt-4 flex justify-end"
            whileHover={{ scale: 1.02 }}
          >
            <Button
              onClick={() => setIsPreview(!isPreview)}
              size="sm"
              variant="outline"
            >
              {isPreview ? "Edit Post" : "Preview Post"}
            </Button>
          </motion.div>
        </motion.div>
      </ContentBox>
      <SectionTitle
        description="Write once, customize for each platform's unique style and requirements."
        title="Create Your Post"
      />
    </SectionWrapper>
  );
};

// Platform Selection Section
const PlatformSection = () => {
  const [platforms, setPlatforms] = useState([
    { name: "Twitter", active: true, icon: "𝕏" },
    { name: "LinkedIn", active: true, icon: "in" },
    { name: "Instagram", active: false, icon: "📸" },
    { name: "Facebook", active: true, icon: "f" },
  ]);

  const togglePlatform = (index: number) => {
    setPlatforms(
      platforms.map((p, i) => (i === index ? { ...p, active: !p.active } : p))
    );
  };

  return (
    <SectionWrapper>
      <ContentBox>
        <motion.div
          className="flex h-full flex-col"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Select Platforms</h4>
          </div>
          <div className="space-y-3">
            {platforms.map((platform, index) => (
              <motion.button
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border p-3",
                  platform.active
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-card/50"
                )}
                initial={{ opacity: 0, x: -20 }}
                key={platform.name}
                onClick={() => togglePlatform(index)}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium">
                    {platform.icon}
                  </span>
                  <span
                    className={
                      platform.active
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {platform.name}
                  </span>
                </div>
                <motion.div
                  animate={{
                    scale: platform.active ? 1 : 0.8,
                    opacity: platform.active ? 1 : 0.5,
                  }}
                  className={cn(
                    "h-3 w-3 rounded-full",
                    platform.active ? "bg-primary" : "bg-muted"
                  )}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </ContentBox>
      <SectionTitle
        description="Choose where you want your content to appear, each optimized for the platform."
        title="Pick Your Platforms"
      />
    </SectionWrapper>
  );
};

// Schedule Section
const ScheduleSection = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    }
  };

  return (
    <SectionWrapper>
      <ContentBox>
        <motion.div
          className="flex h-full flex-col"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Schedule Posts</h4>
          </div>
          <div className="relative flex-grow rounded-lg border border-border bg-card/50 p-4">
            <NaturalDatePicker
              className="w-full"
              customSuggestions={[
                { label: "Best time today", value: "today at 5pm" },
                { label: "Best time tomorrow", value: "tomorrow at 10am" },
                { label: "This weekend", value: "saturday at 12pm" },
                { label: "Next week", value: "next monday at 9am" },
              ]}
              onChange={handleDateSelect}
              placeholder="Tomorrow or next sunday at 2pm..."
              value={selectedDate}
            />
            <motion.div
              animate={{
                opacity: showConfirmation ? 1 : 0,
                y: showConfirmation ? 0 : 10,
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-primary-foreground text-sm"
              initial={{ opacity: 0, y: 10 }}
            >
              Schedule set! ✨
            </motion.div>
          </div>
        </motion.div>
      </ContentBox>
      <SectionTitle
        description="Set it and forget it - we'll handle the posting at the perfect time."
        title="Schedule & Forget"
      />
    </SectionWrapper>
  );
};

// Main Features3 component
const Features3 = () => {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <GradientTitle>
            Three Steps to <span className="text-primary">More Free Time</span>
          </GradientTitle>
          <p className="text-gray-600">
            Streamline your social media workflow with our simple three-step
            process
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <CreatePostSection />
          <PlatformSection />
          <ScheduleSection />
        </div>
        <div className="mt-8 text-center">
          <Link
            className="inline-flex items-center font-medium text-primary hover:text-primary/90"
            href="https://solulu.delulu.social/sign-in"
          >
            Try Scheduling Now →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features3;
