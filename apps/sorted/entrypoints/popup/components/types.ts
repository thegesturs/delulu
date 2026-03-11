import type { api } from "@delulu/database/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
export const convex = new ConvexHttpClient(CONVEX_URL);
export const SYNC_HOST = import.meta.env.VITE_CLERK_SYNC_HOST;
export const PAGE_SIZE = 10;

export interface ActiveTranscription {
  reelId: string;
  reelUrl: string;
  startedAt: number;
}

export interface UsageData {
  used: number;
  limit: number;
  isSubscribed: boolean;
  paidSoftLimit: number;
  paidHardLimit: number;
}

// Infer the transcription type from the paginated Convex query
type TranscriptionPage = Awaited<
  ReturnType<
    typeof convex.query<typeof api.transcriptions.getUserTranscriptions>
  >
>;
export type Transcription = TranscriptionPage["page"][number];
