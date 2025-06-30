'use client';

import { FacebookPageSelect } from '@/components/socials/facebook-page-select';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

interface FacebookPageData {
  id: string;
  name: string;
  access_token: string;
  category: string;
  picture?: {
    data: {
      url: string;
      width: number;
      height: number;
      is_silhouette: boolean;
    };
  };
  cover?: {
    id: string;
    source: string;
    offset_y: number;
  };
  link?: string;
  followers_count?: number;
  fan_count?: number;
  verification_status?: string;
}

export default function FacebookPageSelectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const key = searchParams.get('key');
  const code = searchParams.get('code');

  const { data: pages, error } = useQuery<FacebookPageData[]>({
    queryKey: ['facebook-pages', key],
    queryFn: async () => {
      if (!key) {
        return [];
      }
      const response = await fetch('/api/facebook/pages?key=' + key);
      if (!response.ok) {
        throw new Error('Failed to fetch page data');
      }
      return response.json();
    },
    enabled: !!key,
  });

  if (error) {
    router.push(
      '/socials?error=Failed to load Facebook pages&code=FACEBOOK_006&provider=facebook'
    );
    return null;
  }

  if (!key || !code || !pages?.length) {
    return null;
  }

  return <FacebookPageSelect pages={pages} code={code} />;
}
