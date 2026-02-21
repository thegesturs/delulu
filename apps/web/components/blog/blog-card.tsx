import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { BlurImage } from "@/components/blog/blur-image";
import { Logo } from "@/components/logo";
import { truncate } from "@/lib/utils";
import type { UnifiedBlog } from "@/types/blog";

export const BlogCard = ({ blog }: { blog: UnifiedBlog }) => {
  return (
    <Link
      className="group grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-border/50 bg-card transition duration-200 hover:border-border hover:shadow-lg sm:grid-cols-2"
      href={`/blog/${blog.slug}`}
    >
      <div>
        {blog.image ? (
          <BlurImage
            alt={blog.title}
            className="h-48 w-full object-cover object-top sm:h-full sm:max-h-96 sm:rounded-l-3xl"
            height="800"
            src={blog.image || ""}
            width="800"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-muted sm:h-full">
            <Logo />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between p-4 sm:p-6 md:p-8">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {blog.categories?.map((category, idx) => (
              <p
                className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground text-xs capitalize"
                key={`category-${idx}`}
              >
                {category}
              </p>
            ))}
          </div>
          <p className="mb-2 font-bold text-foreground text-lg md:text-2xl lg:text-3xl">
            <Balancer>{blog.title}</Balancer>
          </p>
          <p className="mt-2 text-left text-muted-foreground text-sm md:text-base">
            {truncate(blog.description, 500)}
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          {blog.authorAvatar && (
            <Image
              alt={blog.author}
              className="h-5 w-5 rounded-full"
              height={20}
              src={blog.authorAvatar}
              width={20}
            />
          )}
          <p className="font-normal text-muted-foreground text-sm">
            {blog.author}
          </p>
          <div className="h-1 w-1 rounded-full bg-border" />
          <p className="text-muted-foreground text-sm">
            {format(new Date(blog.date), "MMMM dd, yyyy")}
          </p>
        </div>
      </div>
    </Link>
  );
};

export const BlogCardVertical = ({ blog }: { blog: UnifiedBlog }) => {
  return (
    <Link
      className="group flex w-full flex-col overflow-hidden rounded-3xl border border-border/50 bg-card transition duration-200 hover:border-border hover:shadow-lg"
      href={`/blog/${blog.slug}`}
    >
      <div>
        {blog.image ? (
          <BlurImage
            alt={blog.title}
            className="h-48 w-full object-cover object-top sm:h-64 md:h-72"
            height="800"
            src={blog.image || ""}
            width="800"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-muted sm:h-64 md:h-72">
            <Logo />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {blog.categories?.map((category, idx) => (
              <p
                className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground text-xs capitalize"
                key={`category-${idx}`}
              >
                {category}
              </p>
            ))}
          </div>
          <p className="mb-2 font-bold text-foreground text-lg md:text-xl">
            <Balancer>{blog.title}</Balancer>
          </p>
          <p className="mt-2 text-left text-muted-foreground text-sm">
            {truncate(blog.description, 200)}
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          {blog.authorAvatar && (
            <Image
              alt={blog.author}
              className="h-5 w-5 rounded-full"
              height={20}
              src={blog.authorAvatar}
              width={20}
            />
          )}
          <p className="font-normal text-muted-foreground text-sm">
            {blog.author}
          </p>
          <div className="h-1 w-1 rounded-full bg-border" />
          <p className="text-muted-foreground text-sm">
            {format(new Date(blog.date), "MMMM dd, yyyy")}
          </p>
        </div>
      </div>
    </Link>
  );
};
