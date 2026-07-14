import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      CLOUDFLARE_EMAIL_FROM: z.string().min(1).email().optional(),
    },
    runtimeEnv: {
      CLOUDFLARE_EMAIL_FROM: process.env.CLOUDFLARE_EMAIL_FROM,
    },
  });
