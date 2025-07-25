'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import {
  Calendar,
  FileText,
  Plus,
  Settings,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();

  const primaryActions = [
    {
      title: 'Create Post',
      description: 'Write and schedule new content',
      icon: Plus,
      action: () => router.push('/post'),
      variant: 'default' as const,
      className: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    {
      title: 'Upload Media',
      description: 'Add images and videos to library',
      icon: Upload,
      action: () => router.push('/media'),
      variant: 'outline' as const,
    },
  ];

  const secondaryActions = [
    {
      title: 'Social Accounts',
      description: 'Manage platform connections',
      icon: Users,
      action: () => router.push('/socials'),
      badge: null,
    },
    {
      title: 'Content Calendar',
      description: 'Plan your posting schedule',
      icon: Calendar,
      action: () => router.push('/calendar'),
      badge: null,
    },
    {
      title: 'All Posts',
      description: 'Browse and manage content',
      icon: FileText,
      action: () => router.push('/posts'),
      badge: null,
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      icon: Zap,
      action: () => router.push('/analytics'),
      badge: 'Soon',
    },
    {
      title: 'Settings',
      description: 'Configure your preferences',
      icon: Settings,
      action: () => router.push('/settings'),
      badge: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {primaryActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{action.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {action.description}
                    </p>
                  </div>
                  <Button variant={action.variant} size="sm">
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
          <CardDescription>
            Jump to any section of your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {secondaryActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.title}
                  className="cursor-pointer hover:bg-accent/50 p-4 rounded-lg transition-colors group border border-transparent hover:border-border"
                  onClick={action.action}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-muted group-hover:bg-muted/80 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm truncate">
                          {action.title}
                        </h4>
                        {action.badge && (
                          <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs truncate">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}