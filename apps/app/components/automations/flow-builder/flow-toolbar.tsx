'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import { Label } from '@delulu/design-system/components/ui/label';
import { Switch } from '@delulu/design-system/components/ui/switch';
import { Icon } from '@delulu/design-system/providers/icon';
import { ArrowLeft01Icon, Loading03Icon } from '@hugeicons-pro/core-solid-rounded';
import Link from 'next/link';
import type { AutomationMeta } from './utils/flow-types';

interface FlowToolbarProps {
  automationMeta: AutomationMeta;
  onMetaChange: (meta: AutomationMeta) => void;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onToggleActive: (active: boolean) => void;
}

export function FlowToolbar({
  automationMeta,
  onMetaChange,
  isDirty,
  isSaving,
  onSave,
  onToggleActive,
}: FlowToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Link href="/automations">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Icon icon={ArrowLeft01Icon} size={18} />
          </Button>
        </Link>
        <Input
          value={automationMeta.name}
          onChange={(e) =>
            onMetaChange({ ...automationMeta, name: e.target.value })
          }
          placeholder="Automation name..."
          className="h-8 w-[240px] border-none bg-transparent font-semibold text-base shadow-none focus-visible:ring-1"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="active-toggle" className="text-xs">
            {automationMeta.isActive ? 'Active' : 'Inactive'}
          </Label>
          <Switch
            id="active-toggle"
            checked={automationMeta.isActive}
            onCheckedChange={onToggleActive}
          />
        </div>

        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
          variant={isDirty ? 'default' : 'outline'}
        >
          {isSaving ? (
            <>
              <Icon icon={Loading03Icon} size={14} className="mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
}
