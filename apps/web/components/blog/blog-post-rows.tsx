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
          Latest <span className="text-orange-500">Blogs</span>
        </h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blogs"
          className="rounded-md border border-gray-200 bg-gray-100 p-2 text-gray-900 text-sm placeholder-gray-500 outline-none focus:outline-none focus:ring-0"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No results found</p>
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
              className="rounded bg-orange-100 px-2 py-1 font-medium text-orange-600 text-xs"
            >
              {category}
            </span>
          ))}
          <span className="text-gray-500 text-sm">
            {format(new Date(blog.date), 'd MMM, yyyy')}
          </span>
          <span className="text-gray-500 text-sm">•</span>
          <span className="text-gray-500 text-sm">5 min read</span>
        </div>

        <h2 className="mb-2 line-clamp-2 font-semibold text-gray-900 text-xl group-hover:text-gray-600">
          {blog.title}
        </h2>

        <p className="mb-4 line-clamp-2 text-gray-600 text-sm">
          {blog.description}
        </p>

        <div className="flex items-center gap-2">
          <Image
            src={blog.authorAvatar}
            alt={blog.author}
            width={24}
            height={24}
            className="rounded-full object-cover"
          />
          <span className="text-gray-700 text-sm">{blog.author}</span>
        </div>
      </div>
    </Link>
  );
};
