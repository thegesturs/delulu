import { BlurImage } from '@/components/blog/blur-image';
import { truncate } from '@/lib/utils';
import type { Blog } from 'content-collections';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import Balancer from 'react-wrap-balancer';
import { Logo } from '../logo';

export const BlogCard = ({ blog }: { blog: Blog }) => {
  return (
    <Link
      className="group grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-transparent shadow-lg transition duration-200 hover:scale-[1.02] hover:border-gray-200 hover:bg-gray-50 md:grid-cols-2"
      href={`/blog/${blog.slug}`}
    >
      <div className="">
        {blog.image ? (
          <BlurImage
            src={blog.image || ''}
            alt={blog.title}
            height="800"
            width="800"
            className="h-full max-h-96 w-full rounded-3xl object-cover object-top"
          />
        ) : (
          <div className="flex h-full items-center justify-center group-hover:bg-gray-50">
            <Logo />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between p-4 group-hover:bg-gray-50 md:p-8">
        <div>
          <div className="mb-4 flex flex-wrap gap-4">
            {blog.categories?.map((category, idx) => (
              <p
                key={`category-${idx}`}
                className="rounded-full bg-gray-100 px-4 py-2 font-bold text-gray-600 text-xs capitalize"
              >
                {category}
              </p>
            ))}
          </div>
          <p className="mb-4 font-bold text-gray-900 text-lg md:text-4xl">
            <Balancer>{blog.title}</Balancer>
          </p>
          <p className="mt-2 text-left text-base text-gray-600 md:text-xl">
            {truncate(blog.description, 500)}
          </p>
        </div>
        <div className="mt-6 flex items-center space-x-2">
          <Image
            src={blog.authorAvatar}
            alt={blog.author}
            width={20}
            height={20}
            className="h-5 w-5 rounded-full"
          />
          <p className="font-normal text-gray-600 text-sm">{blog.author}</p>
          <div className="h-1 w-1 rounded-full bg-gray-400" />
          <p className="max-w-xl text-gray-600 text-sm transition duration-200 group-hover:text-gray-900">
            {format(new Date(blog.date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>
    </Link>
  );
};

export const BlogCardVertical = ({ blog }: { blog: Blog }) => {
  return (  
    <Link
      className="group w-full overflow-hidden rounded-3xl border border-transparent shadow-lg transition duration-200 hover:scale-[1.02] hover:border-gray-200 hover:bg-gray-50"
      href={`${blog.slug}`}
    >
      <div className="">
        {blog.image ? (
          <BlurImage
            src={blog.image || ''}
            alt={blog.title}
            height="800"
            width="800"
            className="h-64 w-full rounded-3xl object-cover object-top md:h-96"
          />
        ) : (
          <div className="flex h-64 items-center justify-center group-hover:bg-gray-50 md:h-96">
            <Logo />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between p-4 group-hover:bg-gray-50 md:p-8">
        <div>
          <div className="mb-4 flex flex-wrap gap-4">
            {blog.categories?.map((category, idx) => (
              <p
                key={`category-${idx}`}
                className="rounded-full bg-gray-100 px-4 py-2 font-bold text-gray-600 text-xs capitalize"
              >
                {category}
              </p>
            ))}
          </div>
          <p className="mb-4 font-bold text-gray-900 text-lg md:text-xl">
            <Balancer>{blog.title}</Balancer>
          </p>
          <p className="mt-2 text-left text-gray-600 text-sm md:text-base">
            {truncate(blog.description, 200)}
          </p>
        </div>
        <div className="mt-6 flex items-center space-x-2">
          <Image
            src={blog.authorAvatar}
            alt={blog.author}
            width={20}
            height={20}
            className="h-5 w-5 rounded-full"
          />
          <p className="font-normal text-gray-600 text-sm">{blog.author}</p>
          <div className="h-1 w-1 rounded-full bg-gray-400" />
          <p className="max-w-xl text-gray-600 text-sm transition duration-200 group-hover:text-gray-900">
            {format(new Date(blog.date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>
    </Link>
  );
};
