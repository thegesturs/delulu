'use client';

import { Header } from '@/components/layout/header';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@delulu/design-system/components/ui/card';
import { Input } from '@delulu/design-system/components/ui/input';
import { Label } from '@delulu/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import { Switch } from '@delulu/design-system/components/ui/switch';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Add01Icon,
  Delete01Icon,
  Loading03Icon,
  ArrowLeft01Icon,
} from '@hugeicons-pro/core-solid-rounded';
import { useQuery } from 'convex-helpers/react/cache';
import { useMutation } from 'convex/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Condition {
  operator: string;
  value: string;
  caseSensitive: boolean;
}

const OPERATORS = [
  { value: 'always', label: 'Always (any comment)' },
  { value: 'contains', label: 'Contains keyword' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'equals', label: 'Equals exactly' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'regex', label: 'Matches regex' },
];

const VARIABLES = [
  { name: '{username}', description: "The commenter's Instagram username" },
  { name: '{comment_text}', description: 'The full text of the comment' },
];

export default function EditAutomationPage() {
  const params = useParams();
  const router = useRouter();
  const automationId = params.id as Id<'automations'>;

  const automation = useQuery(api.automations.getAutomation, { id: automationId });
  const updateAutomation = useMutation(api.automations.updateAutomation);

  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [maxDMsPerHour, setMaxDMsPerHour] = useState(20);
  const [maxDMsPerDay, setMaxDMsPerDay] = useState(100);

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setDescription(automation.description || '');
      setIsActive(automation.isActive);
      setConditions(
        automation.conditions.map((c) => ({
          operator: c.operator,
          value: c.value || '',
          caseSensitive: c.caseSensitive || false,
        }))
      );
      setMessageTemplate(automation.messageTemplate);
      setMaxDMsPerHour(automation.maxDMsPerHour);
      setMaxDMsPerDay(automation.maxDMsPerDay);
    }
  }, [automation]);

  const addCondition = () => {
    setConditions([...conditions, { operator: 'contains', value: '', caseSensitive: false }]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (index: number, field: keyof Condition, value: string | boolean) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const insertVariable = (variable: string) => {
    setMessageTemplate(messageTemplate + variable);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (!messageTemplate.trim()) {
      toast.error('Please enter a message template');
      return;
    }

    setIsSaving(true);
    try {
      await updateAutomation({
        id: automationId,
        name: name.trim(),
        description: description.trim() || undefined,
        isActive,
        conditions: conditions.map((c) => ({
          operator: c.operator as 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'always' | 'not_contains',
          value: c.operator === 'always' ? undefined : c.value,
          caseSensitive: c.caseSensitive,
        })),
        messageTemplate,
        maxDMsPerHour,
        maxDMsPerDay,
      });

      toast.success('Automation updated successfully');
      router.push('/automations');
    } catch (error) {
      console.error('Failed to update automation:', error);
      toast.error('Failed to update automation');
    } finally {
      setIsSaving(false);
    }
  };

  if (automation === undefined) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header pages={['Automations']} page="Loading..." />
          <div className="flex h-64 items-center justify-center">
            <Icon icon={Loading03Icon} size={24} className="animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (automation === null) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header pages={['Automations']} page="Not Found" />
          <div className="flex h-64 flex-col items-center justify-center">
            <p className="text-muted-foreground">Automation not found</p>
            <Link href="/automations">
              <Button variant="link">Back to Automations</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/automations">
              <Button variant="ghost" size="icon">
                <Icon icon={ArrowLeft01Icon} size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-2xl">Edit Automation</h1>
              <p className="text-muted-foreground text-sm">
                Update your automation settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="active-toggle" className="text-sm">
                {isActive ? 'Active' : 'Inactive'}
              </Label>
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Automation name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this automation do?"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max DMs per hour</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={maxDMsPerHour}
                    onChange={(e) => setMaxDMsPerHour(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max DMs per day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={maxDMsPerDay}
                    onChange={(e) => setMaxDMsPerDay(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trigger Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                All conditions must match for the automation to trigger (AND logic).
              </p>
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(index, 'operator', value)}
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
                          onChange={(e) => updateCondition(index, 'value', e.target.value)}
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
                      <Icon icon={Delete01Icon} size={16} className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addCondition} className="w-full gap-2">
                <Icon icon={Add01Icon} size={16} />
                Add Condition
              </Button>
            </CardContent>
          </Card>

          {/* Message Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">DM Message</Label>
                <Textarea
                  id="message"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-2 font-medium text-sm">Preview</p>
                <p className="whitespace-pre-wrap text-sm">
                  {messageTemplate
                    .replace('{username}', 'john_doe')
                    .replace('{comment_text}', 'Great post!')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
