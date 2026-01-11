import { PostCreator } from '@/components/post/post-creator';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function PostPage() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex-1">
        <Suspense>
          <PostCreator />
        </Suspense>
      </div>
    </div>
  );
}
