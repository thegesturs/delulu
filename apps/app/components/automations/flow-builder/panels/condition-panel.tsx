"use client";

import { Input } from "@delulu/design-system/components/ui/input";
import { Label } from "@delulu/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@delulu/design-system/components/ui/select";
import { Switch } from "@delulu/design-system/components/ui/switch";
import type {
  AutomationConditionOperator,
  ConditionStep,
} from "../utils/flow-types";

const OPERATORS = [
  { value: "always", label: "Always (any comment)" },
  { value: "contains", label: "Contains keyword" },
  { value: "not_contains", label: "Does not contain" },
  { value: "equals", label: "Equals exactly" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "regex", label: "Matches regex" },
];

interface ConditionPanelProps {
  step: ConditionStep;
  onChange: (step: ConditionStep) => void;
}

export function ConditionPanel({ step, onChange }: ConditionPanelProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">Condition</h3>
        <p className="text-muted-foreground text-xs">
          Route the flow based on the comment text.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Operator</Label>
        <Select
          onValueChange={(value) =>
            onChange({
              ...step,
              operator: value as AutomationConditionOperator,
              value: value === "always" ? undefined : step.value,
            })
          }
          value={step.operator}
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
      </div>

      {step.operator !== "always" && (
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            onChange={(e) => onChange({ ...step, value: e.target.value })}
            placeholder="Enter keyword or pattern..."
            value={step.value || ""}
          />
        </div>
      )}

      {step.operator !== "always" && (
        <div className="flex items-center justify-between">
          <Label htmlFor="case-sensitive">Case sensitive</Label>
          <Switch
            checked={step.caseSensitive}
            id="case-sensitive"
            onCheckedChange={(checked) =>
              onChange({ ...step, caseSensitive: checked })
            }
          />
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-muted-foreground text-xs">
          The <span className="font-medium text-green-600">Yes</span> path runs
          when the condition matches. The{" "}
          <span className="font-medium text-red-600">No</span> path runs
          otherwise.
        </p>
      </div>
    </div>
  );
}
