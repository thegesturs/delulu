'use client';

import { cn } from '@delulu/design-system/lib/utils';
import {
  type PromotionContentType,
  promotionContentTypes,
} from '@delulu/validators/post';

interface TikTokConsentBannerProps {
  promotionContent: PromotionContentType;
  className?: string;
  variant?: 'inline' | 'card';
}

export function TikTokConsentBanner({
  promotionContent,
  className,
  variant = 'inline',
}: TikTokConsentBannerProps) {
  const hasBrandedContent =
    promotionContent === promotionContentTypes.PAID ||
    promotionContent === promotionContentTypes.BOTH;

  const content = (
    <p className="text-muted-foreground text-xs">
      By posting, you agree to TikTok's{' '}
      {hasBrandedContent && (
        <>
          <a
            href="https://www.tiktok.com/legal/page/global/bc-policy/en"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Branded Content Policy
          </a>
          {' and '}
        </>
      )}
      <a
        href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground"
      >
        Music Usage Confirmation
      </a>
      .
    </p>
  );

  if (variant === 'card') {
    return (
      <div className={cn('rounded-md bg-muted/50 p-3', className)}>
        {content}
      </div>
    );
  }

  return <div className={className}>{content}</div>;
}
