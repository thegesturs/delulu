'use client';

import { Header } from '@/components/layout/header';
import { PostsView } from '@/components/posts/posts-view';
import type { PostLayout } from '@/components/posts/types';
import { api } from '@/trpc/react';
import { PostStatus } from '@delulu/database';
import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@delulu/design-system/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import { Toggle } from '@delulu/design-system/components/ui/toggle';
// import type { inferRouterOutputs } from '@trpc/server';
import { LayoutGrid, List, Plus } from 'lucide-react';
import React from 'react';
import PostLoading from './post-loading';

// type RouterOutputs = inferRouterOutputs<AppRouter>;
// type ApiPost = RouterOutputs['post']['getPostsByUserId']['posts'][number];

type PostStatusFilterType = 'all' | PostStatus;
const ITEMS_PER_PAGE = 10;

export default function PostsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<PostStatusFilterType>('all');
  const [layout, setLayout] = React.useState<PostLayout>('grid');
  const [currentPage, setCurrentPage] = React.useState(1);

  const {
    data: postsData,
    isLoading,
    error,
    isFetching,
  } = api.post.getPosts.useQuery({
    filters: {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      // searchTerm: searchTerm || undefined,
    },
    pagination: {
      take: ITEMS_PER_PAGE,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
    },
  });

  const filteredPosts = React.useMemo(() => {
    if (!postsData?.posts) return [];
    return postsData.posts;
  }, [postsData]);

  const totalPosts = postsData?.total ?? 0;
  const totalPages = Math.ceil(totalPosts / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading && !postsData) {
    return (
      <div className="space-y-4 p-8">
        <Header pages={['Posts']} page="Posts">
          <Button
            onClick={() => {
              /* TODO: Navigate to create post page */
            }}
          >
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
              disabled
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as PostStatusFilterType)
              }
              disabled
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                {Object.values(PostStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 rounded-lg border">
            <Toggle
              pressed={layout === 'grid'}
              onPressedChange={() => setLayout('grid')}
              aria-label="Grid view"
              disabled
            >
              <LayoutGrid className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={layout === 'list'}
              onPressedChange={() => setLayout('list')}
              aria-label="List view"
              disabled
            >
              <List className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
        <PostLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-8">
        <Header pages={['Posts']} page="Posts">
          <Button
            onClick={() => {
              /* TODO: Navigate to create post page */
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </Header>
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <h3 className="font-semibold">Error loading posts</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <Header pages={['Posts']} page="Posts">
        <Button
          onClick={() => {
            /* TODO: Navigate to create post page */
          }}
        >
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
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as PostStatusFilterType)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              {Object.values(PostStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </SelectItem>
              ))}
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

      {filteredPosts.length === 0 && !isLoading && (
        <div className="py-8 text-center">
          <p className="text-lg text-muted-foreground">
            No posts found. Try adjusting your filters or creating a new post.
          </p>
        </div>
      )}
      {filteredPosts.length > 0 && (
        <PostsView posts={filteredPosts} layout={layout} />
      )}

      {!(isLoading && !postsData) && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1 && !isFetching) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  aria-disabled={currentPage === 1 || isFetching}
                  className={
                    currentPage === 1 || isFetching
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  const showEllipsis =
                    (page === currentPage - 2 &&
                      currentPage > 3 &&
                      totalPages > 5) ||
                    (page === currentPage + 2 &&
                      currentPage < totalPages - 2 &&
                      totalPages > 5);

                  if (showEllipsis) {
                    return (
                      <PaginationItem key={`ellipsis-${page}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  if (showPage) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!isFetching) handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                          aria-current={
                            currentPage === page ? 'page' : undefined
                          }
                          className={
                            isFetching
                              ? 'pointer-events-none opacity-50'
                              : undefined
                          }
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                }
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages && !isFetching) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  aria-disabled={currentPage === totalPages || isFetching}
                  className={
                    currentPage === totalPages || isFetching
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
