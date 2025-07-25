'use client';

import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { useRouter } from 'next/navigation';

interface SocialProvider {
  _id: string;
  socialType: string;
}

interface UpcomingPost {
  _id: string;
  content: Array<{ text?: string }>;
  scheduledAt?: number;
  socialProviders: SocialProvider[];
}

interface UpcomingScheduleProps {
  upcomingPosts: UpcomingPost[];
}

export function UpcomingSchedule({ upcomingPosts }: UpcomingScheduleProps) {
  const router = useRouter();

  if (!upcomingPosts || upcomingPosts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Schedule</CardTitle>
        <CardDescription>
          Posts scheduled for the next 7 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingPosts.slice(0, 5).map((post) => (
            <div
              key={post._id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm">
                    {post.content[0]?.text?.slice(0, 50)}...
                  </p>
                  <div className="flex space-x-1">
                    {post.socialProviders.slice(0, 3).map((provider) =>
                      provider ? (
                        <Badge
                          key={provider._id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {provider.socialType}
                        </Badge>
                      ) : null
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {post.scheduledAt
                    ? new Date(post.scheduledAt).toLocaleString()
                    : 'No date set'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/post/${post._id}/edit`)}
              >
                Edit
              </Button>
            </div>
          ))}
          {upcomingPosts.length > 5 && (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => router.push('/calendar')}
            >
              View full schedule ({upcomingPosts.length} posts)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}