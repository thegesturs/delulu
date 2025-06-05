import fs from 'node:fs';
import { env } from '@/env';
import { allBlogs, allLegals } from 'content-collections';
import type { MetadataRoute } from 'next';

const appFolders = fs.readdirSync('app', { withFileTypes: true });
const pages = appFolders
  .filter((file) => file.isDirectory())
  .filter((folder) => !folder.name.startsWith('_'))
  .filter((folder) => !folder.name.startsWith('('))
  .map((folder) => folder.name);
const blogs = allBlogs.map((blog) => blog.slug);
const legals = allLegals.map((legal) => legal.slug);

const url = new URL(`${env.NEXT_PUBLIC_WEB_URL}`);

const sitemap = async (): Promise<MetadataRoute.Sitemap> => [
  {
    url: new URL('/', url).href,
    lastModified: new Date(),
  },
  ...pages.map((page) => ({
    url: new URL(page, url).href,
    lastModified: new Date(),
  })),
  ...blogs.map((blog) => ({
    url: new URL(`blog/${blog}`, url).href,
    lastModified: new Date(),
  })),
  ...legals.map((legal) => ({
    url: new URL(`legal/${legal}`, url).href,
    lastModified: new Date(),
  })),
];

export default sitemap;
