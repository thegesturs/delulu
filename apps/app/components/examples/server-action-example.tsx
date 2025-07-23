'use client';

import { useCreateMedia, useGetUserMedia } from '@/hooks/use-media';
import { useCreatePost } from '@/hooks/use-social-providers';
import { useState } from 'react';

// Example component showing how to use the new server action hooks
export function ServerActionExample() {
  const [searchTerm, setSearchTerm] = useState('');

  // Query hook usage
  const {
    data: mediaData,
    isLoading: isMediaLoading,
    error: mediaError,
  } = useGetUserMedia({
    limit: 10,
    search: searchTerm || undefined,
  });

  // Mutation hook usage
  const createMediaMutation = useCreateMedia({
    onSuccess: (data) => {
      console.log('Media created successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to create media:', error);
    },
  });

  const createPostMutation = useCreatePost({
    onSuccess: () => {
      console.log('Post created successfully');
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });

  const handleCreateMedia = () => {
    createMediaMutation.mutate({
      bucketKey: 'example-key',
      url: 'https://example.com/image.jpg',
      mediaType: 'IMAGE',
      originalFilename: 'example.jpg',
    });
  };

  const handleCreatePost = () => {
    createPostMutation.mutate({
      content: [
        {
          id: '1',
          order: 1,
          name: 'Hello from server actions!',
          media: [],
          text: 'Hello from server actions!',
          tags: [],
        },
      ],
      socialProviders: [
        {
          socialId: 'example-social-id',
          name: 'example-social-id',
          socialType: 'FACEBOOK',
        },
      ],
      alternativeContent: [],
    });
  };

  if (isMediaLoading) {
    return <div>Loading media...</div>;
  }

  if (mediaError) {
    return <div>Error loading media: {mediaError.message}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 font-bold text-xl">Server Action Example</h2>

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search media..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Media list */}
      <div className="mb-4">
        <h3 className="mb-2 font-semibold text-lg">
          Media ({mediaData?.media?.length || 0})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {mediaData?.media?.map((item) => (
            <div key={item._id} className="rounded border p-2">
              <img
                src={item.url}
                alt={item.altText || 'Media'}
                className="h-32 w-full rounded object-cover"
              />
              <p className="mt-1 text-sm">{item.originalFilename}</p>
            </div>
          ))}
        </div>
        {mediaData?.hasMore && (
          <p className="mt-2 text-gray-600 text-sm">More media available...</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-x-2">
        <button
          onClick={handleCreateMedia}
          disabled={createMediaMutation.isPending}
          type="button"
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
        >
          {createMediaMutation.isPending ? 'Creating...' : 'Create Media'}
        </button>

        <button
          onClick={handleCreatePost}
          disabled={createPostMutation.isPending}
          type="button"
          className="rounded bg-green-500 px-4 py-2 text-white disabled:opacity-50"
        >
          {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
        </button>
      </div>
    </div>
  );
}
