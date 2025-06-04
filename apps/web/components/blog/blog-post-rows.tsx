"use client";
import { format } from "date-fns";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import FuzzySearch from "fuzzy-search";
import { Blog } from "content-collections";
import Link from "next/link";

export const BlogPostRows = ({ blogs }: { blogs: Blog[] }) => {
  const [search, setSearch] = useState("");
  const searcher = useMemo(
    () =>
      new FuzzySearch(blogs, ["title", "description"], {
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
      <div className="flex flex-col gap-4 mb-10">
        <h1 className="text-4xl font-bold">
          Latest <span className="text-orange-500">Blogs</span>
        </h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blogs"
          className="text-sm p-2 rounded-md bg-gray-100 border border-gray-200 focus:ring-0 focus:outline-none outline-none text-gray-900 placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.length === 0 ? (
          <p className="text-gray-500 text-center p-4">No results found</p>
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
      className="group rounded-2xl overflow-hidden bg-white hover:shadow-lg transition duration-200"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <Image
          src={blog.image || "/placeholder-image.jpg"} // Make sure to handle missing cover images
          alt={blog.title}
          fill
          className="object-cover group-hover:scale-105 transition duration-200 rounded-xl"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {blog.categories.map((category, i) => (
            <span
              key={i}
              className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-1 rounded"
            >
              {category}
            </span>
          ))}
          <span className="text-sm text-gray-500">
            {format(new Date(blog.date), "d MMM, yyyy")}
          </span>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">5 min read</span>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600">
          {blog.title}
        </h2>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
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
          <span className="text-sm text-gray-700">{blog.author}</span>
        </div>
      </div>
    </Link>
  );
};
