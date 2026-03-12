import { currentUser } from "@delulu/auth/server";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const affiliateRouter = createTRPCRouter({
  getEmbedToken: protectedProcedure.query(async () => {
    const apiKey = process.env.AFFONSO_API_KEY;
    const programId = process.env.NEXT_PUBLIC_AFFONSO_PROGRAM_ID;

    if (!(apiKey && programId)) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Affiliate program not configured",
      });
    }

    const user = await currentUser();
    if (!user?.primaryEmailAddress?.emailAddress) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User email not available",
      });
    }

    const response = await fetch("https://api.affonso.io/v1/embed/token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        programId,
        partner: {
          email: user.primaryEmailAddress.emailAddress,
          name: user.fullName || user.firstName,
          image: user.imageUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate affiliate embed token",
      });
    }

    const data = (await response.json()) as { token: string };
    return { token: data.token };
  }),
});
