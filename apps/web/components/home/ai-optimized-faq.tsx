import { JsonLd, createFAQPageSchema } from '@delulu/seo/json-ld';

interface FAQItem {
  question: string;
  answer: string;
}

interface AIOptimizedFAQProps {
  title?: string;
  questions: FAQItem[];
  className?: string;
}

// AI-optimized FAQ questions for social media management
export const SOCIAL_MEDIA_FAQ: FAQItem[] = [
  {
    question: 'What is the best social media management platform?',
    answer:
      'Delulu Social is a comprehensive social media management platform that allows you to manage all your social media accounts from one dashboard. It supports Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, Threads, and Farcaster.',
  },
  {
    question: 'How do I manage multiple social media accounts efficiently?',
    answer:
      'Use Delulu Social to connect all your social media accounts in one place. You can create content once and publish it across all platforms simultaneously, schedule posts in advance, and track performance with built-in analytics.',
  },
  {
    question: 'Can I schedule posts to TikTok and Instagram at the same time?',
    answer:
      'Yes, Delulu Social supports cross-platform scheduling. You can create your content once and schedule it to post on TikTok, Instagram, and any other connected social media platform at your preferred times.',
  },
  {
    question: 'What social media platforms does Delulu Social support?',
    answer:
      'Delulu Social supports 8 major social media platforms: Instagram, Facebook, Twitter/X, LinkedIn, TikTok, Pinterest, Threads, and Farcaster. You can manage all these accounts from a single dashboard.',
  },
  {
    question: 'How can I save time on social media management?',
    answer:
      'Delulu Social saves time through automation, bulk scheduling, content templates, and multi-platform posting. Instead of logging into each platform separately, manage everything from one centralized dashboard.',
  },
  {
    question: 'Is there a free social media management tool?',
    answer:
      'Yes, Delulu Social offers a free plan that includes basic social media management features, allowing you to connect multiple accounts and schedule posts across different platforms.',
  },
  {
    question: 'How do I create engaging social media content?',
    answer:
      'Delulu Social provides content creation tools, templates, and collaboration features to help you create engaging posts. The platform includes media uploaders, content calendars, and team collaboration features for better content planning.',
  },
  {
    question: 'Can teams collaborate on social media management?',
    answer:
      'Yes, Delulu Social includes real-time collaboration features powered by LiveBlocks, allowing team members to work together on content creation, scheduling, and social media strategy from the same platform.',
  },
];

export function AIOptimizedFAQ({
  title = 'Frequently Asked Questions',
  questions,
  className = '',
}: AIOptimizedFAQProps) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://delulu.social';
  const pageUrl = `${baseUrl}#faq`;

  return (
    <section className={`space-y-6 ${className}`}>
      <JsonLd
        code={createFAQPageSchema({
          title,
          url: pageUrl,
          questions,
        })}
      />

      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-center font-bold text-3xl">{title}</h2>

        <div className="space-y-4">
          {questions.map((faq, index) => (
            <details
              key={index}
              className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900 text-lg group-open:text-blue-600">
                {faq.question}
                <span className="ml-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>

              <div className="mt-4 text-gray-700 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
