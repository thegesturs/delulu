import { PostCreator } from '@/components/post/post-creator';
import { Suspense } from 'react';

export default function PostPage() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex-1">
        <Suspense>
          <PostCreator />
        </Suspense>
      </div>
    </div>
  );
}
