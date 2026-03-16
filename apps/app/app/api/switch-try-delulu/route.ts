import { createDodoClient } from "@delulu/api/lib/dodo";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.CALLMELATER_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    dodoSubscriptionId?: string;
    targetProductId?: string;
  };

  const { dodoSubscriptionId, targetProductId } = body;

  if (!(dodoSubscriptionId && targetProductId)) {
    return NextResponse.json(
      { error: "Missing dodoSubscriptionId or targetProductId" },
      { status: 400 }
    );
  }

  try {
    const dodo = createDodoClient();

    await dodo.subscriptions.changePlan(dodoSubscriptionId, {
      product_id: targetProductId,
      proration_billing_mode: "prorated_immediately",
      quantity: 1,
    });

    // DB update happens automatically via the Dodo webhook (onSubscriptionActive)
    // which replaces metadata with the new product ID, clearing Try Delulu flags

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[switch-try-delulu] Failed:", error);
    return NextResponse.json(
      {
        error: "Failed to switch plan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
