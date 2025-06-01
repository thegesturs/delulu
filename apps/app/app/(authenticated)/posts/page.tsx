'use client';

import { Header } from '@/components/layout/header';
import { PostsView } from '@/components/posts/posts-view';
import type { Post, PostLayout } from '@/components/posts/types';
import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import { Toggle } from '@delulu/design-system/components/ui/toggle';
import { LayoutGrid, List, Plus } from 'lucide-react';
import React from 'react';

// Temporary mock data for development
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    userId: 'user-1',
    organizationId: null,
    status: 'SCHEDULED',
    reviewStatus: 'PENDING',
    privacyStatus: 'PUBLIC',
    postFailureReason: null,
    scheduledAt: new Date('2024-04-01'),
    publishedAt: null,
    lastFailedAt: null,
    retryCount: 0,
    isDeleted: false,
    content: [
      {
        text: 'Excited to announce our latest product launch! 🚀 Stay tuned for more updates. #innovation #tech',
        media: [
          {
            url: 'https://picsum.photos/800/600',
            mediaType: 'IMAGE',
            altText: 'Product launch image',
          },
          {
            url: 'https://picsum.photos/800/601',
            mediaType: 'IMAGE',
            altText: 'Product features',
          },
        ],
        name: 'Product launch',
        order: 0,
        tags: ['innovation', 'tech'],
      },
    ],
    socialProviders: [
      {
        id: 'sp-1',
        organizationId: null,
        userId: 'user-1',
        clientId: null,
        clientSecret: null,
        accessToken: 'token',
        refreshToken: null,
        expiresIn: new Date('2024-12-31'),
        refreshTokenExpiresIn: null,
        profileId: 'twitter-1',
        username: 'twitteruser',
        fullName: 'Twitter User',
        profileImage: '',
        socialType: 'TWITTER',
        isActive: true,
        lastSyncedAt: null,
        connected: true,
      },
      {
        id: 'sp-2',
        organizationId: null,
        userId: 'user-1',
        clientId: null,
        clientSecret: null,
        accessToken: 'token',
        refreshToken: null,
        expiresIn: new Date('2024-12-31'),
        refreshTokenExpiresIn: null,
        profileId: 'instagram-1',
        username: 'instagramuser',
        fullName: 'Instagram User',
        profileImage: '',
        socialType: 'INSTAGRAM',
        isActive: true,
        lastSyncedAt: null,
        connected: true,
      },
      {
        id: 'sp-3',
        organizationId: null,
        userId: 'user-1',
        clientId: null,
        clientSecret: null,
        accessToken: 'token',
        refreshToken: null,
        expiresIn: new Date('2024-12-31'),
        refreshTokenExpiresIn: null,
        profileId: 'linkedin-1',
        username: 'linkedinuser',
        fullName: 'LinkedIn User',
        profileImage: '',
        socialType: 'LINKEDIN',
        isActive: false,
        lastSyncedAt: null,
        connected: false,
      },
    ],
  },
  // Add more mock posts here...
];

export default function PostsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [layout, setLayout] = React.useState<PostLayout>('grid');
  const filteredPosts = React.useMemo(() => {
    return MOCK_POSTS.filter((post) => {
      const matchesSearch = post.content.some((content) =>
        content.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesStatus =
        statusFilter === 'all' || post.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-4 p-8">
      <Header pages={['Posts']} page="Posts">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </Header>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      <PostsView posts={filteredPosts} layout={layout} />
    </div>
  );
}
