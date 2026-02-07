import { api } from "@delulu/database/convex/_generated/api";
import { useQuery } from "convex/react";
import { FEATURE_FLAGS } from "@/lib/feature-flags";

export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS) {
  const user = useQuery(api.users.current);

  const isLoading = user === undefined;
  const enabled =
    !isLoading &&
    user !== null &&
    FEATURE_FLAGS[flag].allowedEmails.includes(user.email);

  return { enabled, isLoading };
}
