import { Suspense } from "react";
import { PostCreator } from "@/components/post/post-creator";

export const dynamic = "force-dynamic";

export default function PostPage() {
  return (
    <div className="h-full w-full">
      <Suspense>
        <PostCreator />
      </Suspense>
    </div>
  );
}
