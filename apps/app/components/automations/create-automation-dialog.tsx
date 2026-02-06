'use client';

import type { SocialProvider } from '@/types/convex';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import { Input } from '@delulu/design-system/components/ui/input';
import { Label } from '@delulu/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@delulu/design-system/components/ui/tabs';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Add01Icon,
  Delete01Icon,
  InformationCircleIcon,
} from '@hugeicons-pro/core-solid-rounded';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PostSelector } from './post-selector';

interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instagramProviders: SocialProvider[];
}

interface Condition {
  operator: string;
  value: string;
  caseSensitive: boolean;
}

const OPERATORS = [
  { value: 'always', label: 'Always (any comment)' },
  { value: 'contains', label: 'Contains keyword' },
  { value: 'equals', label: 'Equals exactly' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'regex', label: 'Matches regex' },
];

const VARIABLES = [
  { name: '{username}', description: "The commenter's Instagram username" },
  { name: '{comment_text}', description: 'The full text of the comment' },
];

export function CreateAutomationDialog({
  open,
  onOpenChange,
  instagramProviders,
}: CreateAutomationDialogProps) {
  const [activeTab, setActiveTab] = useState('basics');
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [socialProviderId, setSocialProviderId] = useState<string>('');
  const [triggerType, setTriggerType] = useState<string>('COMMENT');
  const [conditions, setConditions] = useState<Condition[]>([
    { operator: 'always', value: '', caseSensitive: false },
  ]);
  const [messageTemplate, setMessageTemplate] = useState(
    "Hey {username}! Thanks for commenting. Here's a special link just for you: [YOUR_LINK]"
  );
  const [targetPostIds, setTargetPostIds] = useState<string[]>([]);

  const createAutomation = useMutation(api.automations.createAutomation);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSocialProviderId('');
    setTriggerType('COMMENT');
    setConditions([{ operator: 'always', value: '', caseSensitive: false }]);
    setMessageTemplate(
      "Hey {username}! Thanks for commenting. Here's a special link just for you: [YOUR_LINK]"
    );
    setTargetPostIds([]);
    setActiveTab('basics');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { operator: 'contains', value: '', caseSensitive: false },
    ]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (
    index: number,
    field: keyof Condition,
    value: string | boolean
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const insertVariable = (variable: string) => {
    setMessageTemplate(messageTemplate + variable);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the automation');
      setActiveTab('basics');
      return;
    }

    if (!socialProviderId) {
      toast.error('Please select an Instagram account');
      setActiveTab('basics');
      return;
    }

    if (targetPostIds.length === 0) {
      toast.error('Please select at least one post');
      setActiveTab('posts');
      return;
    }

    if (!messageTemplate.trim()) {
      toast.error('Please enter a message template');
      setActiveTab('message');
      return;
    }

    setIsCreating(true);
    try {
      await createAutomation({
        name: name.trim(),
        description: description.trim() || undefined,
        socialProviderId: socialProviderId as Id<'socialProviders'>,
        triggerType: triggerType as 'COMMENT' | 'MENTION' | 'STORY_REPLY',
        conditions: conditions.map((c) => ({
          operator: c.operator as
            | 'contains'
            | 'equals'
            | 'starts_with'
            | 'ends_with'
            | 'regex'
            | 'always'
            | 'not_contains',
          value: c.operator === 'always' ? undefined : c.value,
          caseSensitive: c.caseSensitive,
        })),
        messageTemplate,
        targetPostIds,
        isActive: false, // Start as inactive
      });

      toast.success('Automation created successfully');
      handleClose();
    } catch (error) {
      console.error('Failed to create automation:', error);
      toast.error('Failed to create automation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Automation</DialogTitle>
          <DialogDescription>
            Set up an automated DM response for Instagram comments
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="posts" disabled={!socialProviderId}>
              Posts
            </TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Automation Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome DM for new followers"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this automation do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Instagram Account *</Label>
              <Select
                value={socialProviderId}
                onValueChange={setSocialProviderId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an Instagram account" />
                </SelectTrigger>
                <SelectContent>
                  {instagramProviders.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No Instagram accounts connected
                    </SelectItem>
                  ) : (
                    instagramProviders.map((provider) => (
                      <SelectItem key={provider._id} value={provider._id}>
                        @{provider.username || provider.fullName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {instagramProviders.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  Connect an Instagram account first to create automations
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger Type</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMENT">Comment on post</SelectItem>
                  <SelectItem value="MENTION" disabled>
                    Mention (coming soon)
                  </SelectItem>
                  <SelectItem value="STORY_REPLY" disabled>
                    Story reply (coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

          </TabsContent>

          <TabsContent value="posts" className="mt-4 space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-blue-800 text-sm dark:bg-blue-900/20 dark:text-blue-200">
              <Icon
                icon={InformationCircleIcon}
                size={16}
                className="mt-0.5 flex-shrink-0"
              />
              <p>
                Choose which posts this automation should monitor. Select at
                least one post for this automation to work.
              </p>
            </div>

            <PostSelector
              socialProviderId={socialProviderId || null}
              selectedPostIds={targetPostIds}
              onSelectionChange={setTargetPostIds}
            />
          </TabsContent>

          <TabsContent value="conditions" className="mt-4 space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-blue-800 text-sm dark:bg-blue-900/20 dark:text-blue-200">
              <Icon
                icon={InformationCircleIcon}
                size={16}
                className="mt-0.5 flex-shrink-0"
              />
              <p>
                Define when this automation should trigger. All conditions must
                match (AND logic). Use "Always" to respond to every comment.
              </p>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        updateCondition(index, 'operator', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {condition.operator !== 'always' && (
                      <Input
                        placeholder="Enter keyword or pattern..."
                        value={condition.value}
                        onChange={(e) =>
                          updateCondition(index, 'value', e.target.value)
                        }
                      />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                    disabled={conditions.length === 1}
                    className="mt-1"
                  >
                    <Icon
                      icon={Delete01Icon}
                      size={16}
                      className="text-destructive"
                    />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addCondition}
              className="w-full gap-2"
            >
              <Icon icon={Add01Icon} size={16} />
              Add Condition
            </Button>
          </TabsContent>

          <TabsContent value="message" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Available Variables</Label>
              <div className="flex flex-wrap gap-2">
                {VARIABLES.map((variable) => (
                  <Button
                    key={variable.name}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable.name)}
                    className="text-xs"
                  >
                    {variable.name}
                  </Button>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Click a variable to insert it into your message
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">DM Message Template *</Label>
              <Textarea
                id="message"
                placeholder="Enter the message to send..."
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-muted-foreground text-xs">
                This message will be sent as a private reply to the commenter
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-2 font-medium text-sm">Preview</p>
              <p className="whitespace-pre-wrap text-sm">
                {messageTemplate
                  .replace('{username}', 'john_doe')
                  .replace('{comment_text}', 'Great post!')}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Automation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
