'use client';
import { PostCreator } from '@/components/post/post-creator';

export default function PostPage() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex-1">
        <PostCreator />
      </div>
    </div>
  );
}
