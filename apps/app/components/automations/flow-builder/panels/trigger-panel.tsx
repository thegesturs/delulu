'use client';

import { PostSelector } from '@/components/automations/post-selector';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Label } from '@delulu/design-system/components/ui/label';
import { cn } from '@delulu/design-system/lib/utils';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  AtIcon,
  Comment01Icon,
  InstagramIcon,
  UserStoryIcon,
} from '@hugeicons-pro/core-solid-rounded';
import type { AutomationTriggerType, TriggerStep } from '../utils/flow-types';

interface SocialProvider {
  _id: string;
  username?: string;
  fullName?: string;
  profileImageUrl?: string;
}

interface TriggerPanelProps {
  trigger: TriggerStep;
  socialProviderId: string;
  instagramProviders: SocialProvider[];
  onSocialProviderChange: (id: string) => void;
  onChange: (trigger: TriggerStep) => void;
}

const TRIGGER_TYPE_OPTIONS: {
  type: AutomationTriggerType;
  label: string;
  description: string;
  icon: typeof Comment01Icon;
  enabled: boolean;
}[] = [
  {
    type: 'COMMENT',
    label: 'Post or Reel Comments',
    description: 'Fires when a user comments on your post or reel',
    icon: Comment01Icon,
    enabled: true,
  },
  {
    type: 'MENTION',
    label: 'Mentions',
    description: 'Fires when a user mentions you',
    icon: AtIcon,
    enabled: false,
  },
  {
    type: 'STORY_REPLY',
    label: 'Story Replies',
    description: 'Fires when a user replies to your story',
    icon: UserStoryIcon,
    enabled: false,
  },
];

export function TriggerPanel({
  trigger,
  socialProviderId,
  instagramProviders,
  onSocialProviderChange,
  onChange,
}: TriggerPanelProps) {
  return (
    <div className="space-y-6">
      {/* Instagram Account */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Instagram Account</Label>
          <p className="text-muted-foreground text-xs">
            Which account runs this automation?
          </p>
        </div>
        <div className="grid gap-2">
          {instagramProviders.map((provider) => (
            <button
              key={provider._id}
              type="button"
              onClick={() => onSocialProviderChange(provider._id)}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                socialProviderId === provider._id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                <Icon icon={InstagramIcon} size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-xs">
                  @{provider.username || provider.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground">Instagram</p>
              </div>
            </button>
          ))}
          {instagramProviders.length === 0 && (
            <p className="text-muted-foreground text-xs">
              No Instagram accounts connected.
            </p>
          )}
        </div>
      </div>

      {/* Trigger Type */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Trigger Type</Label>
          <p className="text-muted-foreground text-xs">
            What event should fire this trigger?
          </p>
        </div>
        <div className="grid gap-2">
          {TRIGGER_TYPE_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              disabled={!option.enabled}
              onClick={() =>
                option.enabled &&
                onChange({ ...trigger, triggerType: option.type })
              }
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                !option.enabled && 'cursor-not-allowed opacity-50',
                option.enabled && trigger.triggerType === option.type
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : option.enabled
                    ? 'border-border hover:border-primary/50'
                    : 'border-border'
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                <Icon icon={option.icon} size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-xs">{option.label}</p>
                  {!option.enabled && (
                    <Badge variant="secondary" className="text-[10px]">
                      SOON
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target Posts */}
      <div className="space-y-2">
        <Label>Target Posts</Label>
        <p className="text-muted-foreground text-xs">
          Select which posts this trigger monitors.
        </p>
        <PostSelector
          socialProviderId={socialProviderId || null}
          selectedPostIds={trigger.targetPostIds}
          onSelectionChange={(postIds) =>
            onChange({ ...trigger, targetPostIds: postIds })
          }
        />
      </div>
    </div>
  );
}
