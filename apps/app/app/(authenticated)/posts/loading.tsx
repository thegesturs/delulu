import { Skeleton } from '@delulu/design-system/components/ui/skeleton';
import PostLoading from './post-loading';

export default function PostsLoading() {
  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-[320px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>

      <PostLoading />
    </div>
  );
}
