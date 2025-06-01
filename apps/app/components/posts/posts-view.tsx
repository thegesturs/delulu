'use client';
import { PostCard } from './post-card';
import type { Post, PostLayout } from './types';

interface PostsViewProps {
  posts: Post[];
  layout?: PostLayout;
}

export function PostsView({ posts, layout = 'grid' }: PostsViewProps) {
  return (
    <div className="space-y-6">
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'flex flex-col gap-4'
        }
      >
        {posts.map((post) => (
          <PostCard key={post.id} post={post} layout={layout} />
        ))}
      </div>
    </div>
  );
}
