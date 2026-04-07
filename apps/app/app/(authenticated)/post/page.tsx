import { Suspense } from "react";
import { PostCreator } from "@/components/post/post-creator";

export const dynamic = "force-dynamic";

export default function PostPage() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="min-h-0 flex-1">
        <Suspense>
          <PostCreator />
        </Suspense>
      </div>
    </div>
  );
}
