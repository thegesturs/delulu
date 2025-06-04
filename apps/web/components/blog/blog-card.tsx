import React from "react";
import { BlurImage } from "@/components/blog/blur-image";
import Image from "next/image";
import Balancer from "react-wrap-balancer";
import { truncate } from "@/lib/utils";
import { format } from "date-fns";
import { Blog } from "content-collections";
import { Logo } from "../logo";
import Link from "next/link";

export const BlogCard = ({ blog }: { blog: Blog }) => {
  return (
    <Link
      className="shadow-lg grid grid-cols-1 md:grid-cols-2 rounded-3xl group border border-transparent hover:border-gray-200 w-full hover:bg-gray-50 overflow-hidden hover:scale-[1.02] transition duration-200"
      href={`/blog/${blog.slug}`}
    >
      <div className="">
        {blog.image ? (
          <BlurImage
            src={blog.image || ""}
            alt={blog.title}
            height="800"
            width="800"
            className="h-full max-h-96 object-cover object-top w-full rounded-3xl"
          />
        ) : (
          <div className="h-full flex items-center justify-center group-hover:bg-gray-50">
            <Logo />
          </div>
        )}
      </div>
      <div className="p-4 md:p-8 group-hover:bg-gray-50 flex flex-col justify-between">
        <div>
          <div className="flex gap-4 flex-wrap mb-4">
            {blog.categories?.map((category, idx) => (
              <p
                key={`category-${idx}`}
                className="text-xs font-bold text-gray-600 px-4 py-2 rounded-full bg-gray-100 capitalize"
              >
                {category}
              </p>
            ))}
          </div>
          <p className="text-lg md:text-4xl font-bold mb-4 text-gray-900">
            <Balancer>{blog.title}</Balancer>
          </p>
          <p className="text-left text-base md:text-xl mt-2 text-gray-600">
            {truncate(blog.description, 500)}
          </p>
        </div>
        <div className="flex space-x-2 items-center mt-6">
          <Image
            src={blog.authorAvatar}
            alt={blog.author}
            width={20}
            height={20}
            className="rounded-full h-5 w-5"
          />
          <p className="text-sm font-normal text-gray-600">{blog.author}</p>
          <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
          <p className="text-gray-600 text-sm max-w-xl group-hover:text-gray-900 transition duration-200">
            {format(new Date(blog.date), "MMMM dd, yyyy")}
          </p>
        </div>
      </div>
    </Link>
  );
};

export const BlogCardVertical = ({ blog }: { blog: Blog }) => {
  return (
    <Link
      className="shadow-lg rounded-3xl group border border-transparent hover:border-gray-200 w-full hover:bg-gray-50 overflow-hidden hover:scale-[1.02] transition duration-200"
      href={`${blog.slug}`}
    >
      <div className="">
        {blog.image ? (
          <BlurImage
            src={blog.image || ""}
            alt={blog.title}
            height="800"
            width="800"
            className="h-64 md:h-96 object-cover object-top w-full rounded-3xl"
          />
        ) : (
          <div className="h-64 md:h-96 flex items-center justify-center group-hover:bg-gray-50">
            <Logo />
          </div>
        )}
      </div>
      <div className="p-4 md:p-8 group-hover:bg-gray-50 flex flex-col justify-between">
        <div>
          <div className="flex gap-4 flex-wrap mb-4">
            {blog.categories?.map((category, idx) => (
              <p
                key={`category-${idx}`}
                className="text-xs font-bold text-gray-600 px-4 py-2 rounded-full bg-gray-100 capitalize"
              >
                {category}
              </p>
            ))}
          </div>
          <p className="text-lg md:text-xl font-bold mb-4 text-gray-900">
            <Balancer>{blog.title}</Balancer>
          </p>
          <p className="text-left text-sm md:text-base mt-2 text-gray-600">
            {truncate(blog.description, 200)}
          </p>
        </div>
        <div className="flex space-x-2 items-center mt-6">
          <Image
            src={blog.authorAvatar}
            alt={blog.author}
            width={20}
            height={20}
            className="rounded-full h-5 w-5"
          />
          <p className="text-sm font-normal text-gray-600">{blog.author}</p>
          <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
          <p className="text-gray-600 text-sm max-w-xl group-hover:text-gray-900 transition duration-200">
            {format(new Date(blog.date), "MMMM dd, yyyy")}
          </p>
        </div>
      </div>
    </Link>
  );
};
