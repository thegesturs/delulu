'use client';

import { PostsView } from '@/components/posts/posts-view';
import type { Post } from '@/components/posts/types';
import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import { Plus } from 'lucide-react';
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

  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality
    console.log('Delete post:', id);
  };

  const handleEdit = (id: string) => {
    // TODO: Implement edit functionality
    console.log('Edit post:', id);
  };

  const handleScheduleChange = (id: string) => {
    // TODO: Implement schedule change functionality
    console.log('Change schedule for post:', id);
  };

  const handlePublish = (id: string) => {
    // TODO: Implement publish functionality
    console.log('Publish post:', id);
  };

  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">Posts</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </div>

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

      <PostsView
        posts={filteredPosts}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onScheduleChange={handleScheduleChange}
        onPublish={handlePublish}
      />
    </div>
  );
}
