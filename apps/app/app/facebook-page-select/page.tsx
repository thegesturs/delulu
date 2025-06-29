'use client';

import { FacebookPageSelect } from '@/components/socials/facebook-page-select';
import { useSearchParams } from 'next/navigation';

interface FacebookPageData {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

export default function FacebookPageSelectPage() {
  const searchParams = useSearchParams();
  const pagesData = searchParams.get('pages');
  const code = searchParams.get('code');

  if (!pagesData || !code) {
    return null;
  }

  const pages = JSON.parse(decodeURIComponent(pagesData)) as FacebookPageData[];

  return <FacebookPageSelect pages={pages} code={code} />;
}
