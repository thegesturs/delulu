import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { VideoTrimmer } from "@/components/tools/youtube-video-trimmer/video-trimmer";
import { getTool } from "@/lib/tools";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social";
const tool = getTool("youtube-video-trimmer")!;

const META_DESCRIPTION =
  "Trim YouTube videos online in seconds. Paste a link or upload a file, pick your start and end, preview instantly, and download a clean MP4 — free, no signup, no watermark.";

export const metadata: Metadata = createMetadata({
  title: "YouTube Trimmer – Trim YouTube Videos Online Free",
  description: META_DESCRIPTION,
  keywords: tool.keywords,
  image: `${WEB_URL}/api/og?title=${encodeURIComponent("YouTube Trimmer")}&description=${encodeURIComponent("Trim & cut YouTube videos online — free, in your browser")}`,
  alternates: {
    canonical: `${WEB_URL}/tools/youtube-video-trimmer`,
  },
});

const howToSteps = [
  {
    name: "Add your video",
    text: "Paste a YouTube URL or drag in a video file from your device. Uploaded files never leave your browser.",
  },
  {
    name: "Pick your start and end",
    text: "Drag the two handles on the timeline, or type exact start and end times, to select the clip you want.",
  },
  {
    name: "Trim and download",
    text: "Hit Trim — the cut happens instantly in your browser — then download your clip as an MP4.",
  },
];

const faq = [
  {
    question: "Is this YouTube trimmer really free?",
    answer:
      "Yes. It's completely free, with no signup, no watermark, and no limits on how many videos you trim.",
  },
  {
    question: "Does my video get uploaded to a server?",
    answer:
      "Uploaded files are trimmed 100% in your browser and never touch our servers. For YouTube links, we fetch the video stream on your behalf, but the trimming itself always happens locally on your device.",
  },
  {
    question: "How do I trim a YouTube video without downloading software?",
    answer:
      "Just paste the YouTube link above, set your start and end points, and click Trim. Everything runs in your browser — there's nothing to install and no account to create.",
  },
  {
    question: "What video formats can I trim?",
    answer:
      "Most common formats work, including MP4, WebM, and MOV. The trimmed output is saved as an MP4.",
  },
  {
    question: "Why is my cut a little off from where I set it?",
    answer:
      "By default we do a fast, lossless 'stream copy' that snaps cuts to the nearest keyframe, so start and end can be off by a second or two. Turn on 'Frame-accurate' to re-encode for an exact cut (it takes a bit longer).",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Because everything runs in your browser's memory, we cap inputs at around 400MB. For long videos, trim shorter sections at a time.",
  },
  {
    question: "Can I trim any YouTube video?",
    answer:
      "You can trim videos you have the rights to use. Please respect YouTube's Terms of Service and the original creator's copyright when downloading or reusing content.",
  },
];

const seoCopy = (
  <>
    <p>
      Need just one moment from a long YouTube video? This free YouTube trimmer
      lets you grab exactly the part you want — a highlight, a quote, a clip for
      social — without installing software, creating an account, or slapping a
      watermark on your video.
    </p>
    <p>
      Paste a YouTube link or drop in your own file, scrub to the exact start
      and end, preview instantly, and download a clean MP4 in seconds.
      Everything runs right in your browser using WebAssembly, so uploaded files
      stay private on your device and trims are fast even on modest laptops.
    </p>
  </>
);

const sections = [
  {
    heading: "Why use this YouTube trimmer",
    body: (
      <ul>
        <li>
          <strong>Free and unlimited</strong> — no signup, no watermark, and no
          cap on how many clips you cut.
        </li>
        <li>
          <strong>Private by design</strong> — files you upload are trimmed
          locally and never sent to a server.
        </li>
        <li>
          <strong>Instant preview</strong> — see the exact frames you're keeping
          before you export.
        </li>
        <li>
          <strong>Clean output</strong> — download a plain MP4 with no branding,
          ready to post anywhere.
        </li>
      </ul>
    ),
  },
  {
    heading: "Common ways to use it",
    body: (
      <ul>
        <li>Clip a highlight or quote from a long video to share on social.</li>
        <li>Cut a YouTube video down to a short segment for a presentation.</li>
        <li>Trim a screen recording or webinar before reposting it.</li>
        <li>
          Make short vertical clips for Reels, TikTok, and Shorts, then schedule
          them with <a href="https://delulu.social">Delulu Social</a>.
        </li>
      </ul>
    ),
  },
  {
    heading: "Supported formats & limitations",
    body: (
      <p>
        The trimmer handles most common video formats, including MP4, WebM, and
        MOV, and exports MP4. Because the work happens in your browser's memory,
        very large files (over ~400MB) may be slow or run out of memory — for
        long videos, trim shorter sections at a time. Fast lossless cuts snap to
        the nearest keyframe; enable "Frame-accurate" mode for an exact,
        re-encoded cut.
      </p>
    ),
  },
  {
    heading: "Privacy & copyright",
    body: (
      <p>
        Uploaded files are processed entirely on your device and are never
        uploaded to us. For YouTube links, we only fetch the stream so your
        browser can trim it. Only trim videos you own or have permission to use,
        and follow YouTube's Terms of Service and the original creator's
        copyright.
      </p>
    ),
  },
];

export default function YouTubeVideoTrimmerPage() {
  return (
    <ToolPageLayout
      faq={faq}
      howToHeading="How to trim a YouTube video"
      howToSteps={howToSteps}
      sections={sections}
      seo={seoCopy}
      tool={tool}
    >
      <VideoTrimmer />
    </ToolPageLayout>
  );
}
