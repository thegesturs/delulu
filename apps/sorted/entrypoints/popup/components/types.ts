export const API_URL =
  import.meta.env.VITE_API_URL ?? "https://api.delulu.social";
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

export interface Transcription {
  id: string;
  reelId: string;
  reelUrl: string;
  text: string;
  altText?: string;
  language: string;
  durationSeconds: number;
  createdAt: number;
}

export interface TranscriptionPage {
  page: Transcription[];
  continueCursor: string;
  isDone: boolean;
}

export async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }
  return (await response.json()) as T;
}
