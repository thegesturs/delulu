import { Skeleton } from "@delulu/design-system/components/ui/skeleton";
import type { PostLayout } from "@/components/posts/types";

interface PostLoadingProps {
  layout?: PostLayout;
}

export default function PostLoading({ layout = "grid" }: PostLoadingProps) {
  if (layout === "list") {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            className="flex items-center gap-x-4 border-b px-3 py-1.5 last:border-b-0"
            key={i}
          >
            <Skeleton className="h-5 w-20 flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24 flex-shrink-0" />
            <div className="flex flex-shrink-0 items-center gap-1">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="space-y-3 px-3 py-1.5" key={i}>
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
