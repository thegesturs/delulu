import { Suspense } from "react";
import { LinkedInAccountSelect } from "./linkedin-account-select";

export const dynamic = "force-dynamic";

export default function LinkedInAccountSelectPage() {
  return (
    <Suspense>
      <LinkedInAccountSelect />
    </Suspense>
  );
}
