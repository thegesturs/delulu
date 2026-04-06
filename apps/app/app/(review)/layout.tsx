import { secure } from "@delulu/security";
import { env } from "env";
import type { ReactNode } from "react";
import { StoreProvider } from "@/providers/store-provider";

interface ReviewLayoutProps {
  readonly children: ReactNode;
}

const ReviewLayout = async ({ children }: ReviewLayoutProps) => {
  if (env.ARCJET_KEY) {
    await secure(["CATEGORY:PREVIEW"]);
  }

  return <StoreProvider>{children}</StoreProvider>;
};

export default ReviewLayout;
