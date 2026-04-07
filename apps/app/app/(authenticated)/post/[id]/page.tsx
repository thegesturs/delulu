import { Suspense } from "react";
import { PostCreator } from "@/components/post/post-creator";

export const dynamic = "force-dynamic";

interface PostEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostEditPage({ params }: PostEditPageProps) {
  const postId = (await params).id;
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex-1">
        <Suspense>
          <PostCreator postId={postId} />
        </Suspense>
      </div>
    </div>
  );
}
