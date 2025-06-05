'use client';
import type { Blog } from 'content-collections';
import { format } from 'date-fns';
import FuzzySearch from 'fuzzy-search';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export const BlogPostRows = ({ blogs }: { blogs: Blog[] }) => {
  const [search, setSearch] = useState('');
  const searcher = useMemo(
    () =>
      new FuzzySearch(blogs, ['title', 'description'], {
        caseSensitive: false,
      }),
    [blogs]
  );
  const [results, setResults] = useState(blogs);

  useEffect(() => {
    const results = searcher.search(search);
    setResults(results);
  }, [search, searcher]);

  return (
    <div className="w-full py-20">
      <div className="mb-10 flex flex-col gap-4">
        <h1 className="font-bold text-4xl">
          Latest <span className="text-primary">Blogs</span>
        </h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blogs"
          className="rounded-md border border-input bg-muted p-2 text-foreground text-sm placeholder-muted-foreground outline-none focus:outline-none focus:ring-0"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.length === 0 ? (
          <p className="p-4 text-center text-muted-foreground">
            No results found
          </p>
        ) : (
          results.map((blog, index) => (
            <BlogPostCard blog={blog} key={blog.slug + index} />
          ))
        )}
      </div>
    </div>
  );
};

export const BlogPostCard = ({ blog }: { blog: Blog }) => {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group overflow-hidden rounded-2xl bg-white transition duration-200 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={blog.image || '/placeholder-image.jpg'} // Make sure to handle missing cover images
          alt={blog.title}
          fill
          className="rounded-xl object-cover transition duration-200 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          {blog.categories.map((category, i) => (
            <span
              key={i}
              className="rounded bg-primary/10 px-2 py-1 font-medium text-primary text-xs"
            >
              {category}
            </span>
          ))}
          <span className="text-muted-foreground text-sm">
            {format(new Date(blog.date), 'd MMM, yyyy')}
          </span>
          <span className="text-muted-foreground text-sm">•</span>
          <span className="text-muted-foreground text-sm">5 min read</span>
        </div>

        <h2 className="mb-2 line-clamp-2 font-semibold text-foreground text-xl group-hover:text-muted-foreground">
          {blog.title}
        </h2>

        <p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
          {blog.description}
        </p>

        <div className="flex items-center gap-2">
          {blog.authorAvatar && (
            <Image
              src={blog.authorAvatar}
              alt={blog.author}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          )}
          <span className="text-muted-foreground text-sm">{blog.author}</span>
        </div>
      </div>
    </Link>
  );
};
