import { verifyToken } from "@clerk/backend";
import { SORTED_LIMITS } from "@delulu/payments/product-ids";
import { TranscriptionService } from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import {
  String as EffectString,
  Layer,
  ManagedRuntime,
  Redacted,
} from "effect";
import Groq from "groq-sdk";
import { Resource } from "sst";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  maxConnections: 3,
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});
const TranscriptionRuntime = ManagedRuntime.make(
  TranscriptionService.layer.pipe(Layer.provideMerge(Pg), Layer.orDie)
);

// ============================================================================
// Types
// ============================================================================

interface LambdaEvent {
  requestContext: { http: { method: string } };
  headers: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
}

interface TranscriptionRequest {
  videoUrl: string;
  reelId: string;
  reelUrl: string;
}

// ============================================================================
// Response helper (CORS handled by SST Function URL config)
// ============================================================================

const RESPONSE_HEADERS = {
  "Content-Type": "application/json",
};

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: RESPONSE_HEADERS,
    body: JSON.stringify(body),
  };
}

// ============================================================================
// Handler
// ============================================================================

export async function handler(event: LambdaEvent) {
  const method = event.requestContext.http.method;

  if (method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    // 1. Extract and verify JWT
    const authHeader =
      event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(401, {
        error: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.slice(7);
    let clerkUserId: string;

    try {
      const payload = await verifyToken(token, {
        secretKey: Resource.CLERK_SECRET_KEY.value,
      });
      clerkUserId = payload.sub;
    } catch {
      return jsonResponse(401, { error: "Invalid or expired token" });
    }

    // 2. Parse request body
    const body: TranscriptionRequest = JSON.parse(event.body || "{}");
    if (!(body.videoUrl && body.reelId && body.reelUrl)) {
      return jsonResponse(400, {
        error: "Missing required fields: videoUrl, reelId, reelUrl",
      });
    }

    // 4. Check for cached transcription
    const cached = await TranscriptionRuntime.runPromise(
      TranscriptionService.use((service) =>
        service.getByReelId({
          externalUserId: clerkUserId,
          reelId: body.reelId,
        })
      )
    );

    if (cached) {
      // Cross-user cache hit: create a record for this user and count against their quota
      if (!cached.isOwnCache) {
        const claimed = await TranscriptionRuntime.runPromise(
          TranscriptionService.use((service) =>
            service.createAndIncrement({
              externalUserId: clerkUserId,
              reelId: body.reelId,
              reelUrl: body.reelUrl,
              text: cached.text,
              altText: cached.altText,
              language: cached.language ?? "unknown",
              durationSeconds: cached.durationSeconds ?? 0,
            })
          )
        );
        if (!claimed.record) {
          return jsonResponse(402, {
            error: claimed.usage.isSortedActive
              ? "hard_limit_reached"
              : "quota_exceeded",
            used: claimed.usage.used,
            limit: claimed.usage.isSortedActive
              ? SORTED_LIMITS.PAID_TRANSCRIPTION_HARD_LIMIT
              : claimed.usage.limit,
          });
        }
      }
      return jsonResponse(200, {
        text: cached.text,
        altText: cached.altText,
        language: cached.language,
        durationSeconds: cached.durationSeconds,
        cached: true,
      });
    }

    // 5. Check quota
    const usage = await TranscriptionRuntime.runPromise(
      TranscriptionService.use((service) => service.usage(clerkUserId))
    );

    if (usage.used >= usage.limit && !usage.isSortedActive) {
      return jsonResponse(402, {
        error: "quota_exceeded",
        message: "Free transcription limit reached. Upgrade to continue.",
        used: usage.used,
        limit: usage.limit,
      });
    }

    // 5b. Hard limit for paid users (safety cap)
    if (
      usage.isSortedActive &&
      usage.used >= SORTED_LIMITS.PAID_TRANSCRIPTION_HARD_LIMIT
    ) {
      return jsonResponse(402, {
        error: "hard_limit_reached",
        message:
          "Monthly transcription limit (1,000) reached. Contact support@delulu.social for higher limits.",
        used: usage.used,
        limit: SORTED_LIMITS.PAID_TRANSCRIPTION_HARD_LIMIT,
      });
    }

    // 6. Download video from Instagram CDN
    const parsedUrl = new URL(body.videoUrl);
    if (
      !(
        parsedUrl.hostname.includes("cdninstagram.com") ||
        parsedUrl.hostname.includes("fbcdn.net")
      )
    ) {
      return jsonResponse(400, { error: "Invalid video URL" });
    }

    console.log(`[Transcription] Downloading video for reel ${body.reelId}`);
    const videoResponse = await fetch(body.videoUrl);
    if (!videoResponse.ok) {
      return jsonResponse(502, {
        error: "Failed to download video from Instagram",
      });
    }

    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const contentLength = Number.parseInt(
      videoResponse.headers.get("content-length") ?? "0",
      10
    );
    if (contentLength > MAX_VIDEO_SIZE) {
      return jsonResponse(413, { error: "Video too large to transcribe" });
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    console.log(
      `[Transcription] Downloaded ${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB`
    );

    // 7. Call Groq Whisper v3
    const groq = new Groq({ apiKey: Resource.GROQ_API_KEY.value });

    const videoFile = new File([videoBuffer], `reel-${body.reelId}.mp4`, {
      type: "video/mp4",
    });

    console.log("[Transcription] Calling Groq Whisper API...");
    const whisperResponse = await groq.audio.transcriptions.create({
      model: "whisper-large-v3",
      file: videoFile,
      response_format: "verbose_json",
    });

    const text = whisperResponse.text;
    const language =
      (whisperResponse as { language?: string }).language ?? "unknown";
    const durationSeconds =
      (whisperResponse as { duration?: number }).duration ?? 0;

    console.log(
      `[Transcription] Whisper returned: ${text.length} chars, language=${language}, duration=${durationSeconds}s`
    );

    // 7b. If Hindi, transliterate Devanagari → Roman script via Groq LLM
    let altText: string | undefined;
    if (language.toLowerCase() === "hindi") {
      try {
        console.log(
          "[Transcription] Hindi detected — transliterating to Roman script..."
        );
        const transliteration = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a transliterator. Convert Hindi (Devanagari script) text to Roman/Latin script (Hinglish). Keep any English words as-is. Only output the transliterated text, nothing else.",
            },
            { role: "user", content: text },
          ],
          temperature: 0,
          max_tokens: 2048,
        });
        altText = transliteration.choices[0]?.message?.content?.trim();
        console.log(
          `[Transcription] Transliteration: ${altText?.length ?? 0} chars`
        );
      } catch (e) {
        console.error("[Transcription] Transliteration failed (non-fatal):", e);
      }
    }

    // 8. Store transcription in Postgres
    const claimed = await TranscriptionRuntime.runPromise(
      TranscriptionService.use((service) =>
        service.createAndIncrement({
          externalUserId: clerkUserId,
          reelId: body.reelId,
          reelUrl: body.reelUrl,
          text,
          altText,
          language,
          durationSeconds,
        })
      )
    );
    if (!claimed.record) {
      return jsonResponse(402, {
        error: claimed.usage.isSortedActive
          ? "hard_limit_reached"
          : "quota_exceeded",
        used: claimed.usage.used,
        limit: claimed.usage.isSortedActive
          ? SORTED_LIMITS.PAID_TRANSCRIPTION_HARD_LIMIT
          : claimed.usage.limit,
      });
    }

    // 10. Log to Dodo Payments metering (fire-and-forget)
    if (usage.isSortedActive && usage.dodoCustomerId) {
      try {
        const isProduction = process.env.ENVIRONMENT === "production";
        const dodoBaseUrl = isProduction
          ? "https://api.dodopayments.com"
          : "https://test.dodopayments.com";
        await fetch(`${dodoBaseUrl}/events/ingest`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Resource.DODO_PAYMENTS_API_KEY.value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            events: [
              {
                event_id: `transcription_${body.reelId}_${Date.now()}`,
                customer_id: usage.dodoCustomerId,
                event_name: "transcription.usage",
                timestamp: new Date().toISOString(),
                metadata: {
                  duration_seconds: durationSeconds,
                  reel_id: body.reelId,
                },
              },
            ],
          }),
        });
      } catch (e) {
        console.error("[Transcription] Failed to log to Dodo metering:", e);
      }
    }

    // 11. Return result
    return jsonResponse(200, {
      text,
      altText,
      language,
      durationSeconds,
      cached: false,
    });
  } catch (error) {
    console.error("[Transcription] Unexpected error:", error);
    return jsonResponse(500, { error: "Internal server error" });
  }
}
