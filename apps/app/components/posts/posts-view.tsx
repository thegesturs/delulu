'use client';

import { Toggle } from '@delulu/design-system/components/ui/toggle';
import { LayoutGrid, List } from 'lucide-react';
import React from 'react';
import { PostCard } from './post-card';
import type { Post, PostLayout } from './types';

interface PostsViewProps {
  posts: Post[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onScheduleChange?: (id: string) => void;
  onPublish?: (id: string) => void;
}

export function PostsView({
  posts,
  onDelete,
  onEdit,
  onScheduleChange,
  onPublish,
}: PostsViewProps) {
  const [layout, setLayout] = React.useState<PostLayout>('grid');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border">
          <Toggle
            pressed={layout === 'grid'}
            onPressedChange={() => setLayout('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={layout === 'list'}
            onPressedChange={() => setLayout('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'flex flex-col gap-4'
        }
      >
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            layout={layout}
            onDelete={onDelete}
            onEdit={onEdit}
            onScheduleChange={onScheduleChange}
            onPublish={onPublish}
          />
        ))}
      </div>
    </div>
  );
}
