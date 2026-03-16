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
import type { DelayStep } from "../utils/flow-types";

interface DelayPanelProps {
  step: DelayStep;
  onChange: (step: DelayStep) => void;
}

const MAX_DURATION: Record<string, number> = {
  minutes: 10_080, // 7 days in minutes
  hours: 168, // 7 days in hours
  days: 7,
};

export function DelayPanel({ step, onChange }: DelayPanelProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">Delay</h3>
        <p className="text-muted-foreground text-xs">
          Wait before executing the next step. Max 7 days.
        </p>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label>Duration</Label>
          <Input
            max={MAX_DURATION[step.unit] ?? 10_080}
            min={1}
            onChange={(e) => {
              const val = Math.max(
                1,
                Math.min(
                  Number(e.target.value) || 1,
                  MAX_DURATION[step.unit] ?? 10_080
                )
              );
              onChange({ ...step, duration: val });
            }}
            type="number"
            value={step.duration}
          />
        </div>
        <div className="w-32 space-y-2">
          <Label>Unit</Label>
          <Select
            onValueChange={(unit: "minutes" | "hours" | "days") =>
              onChange({
                ...step,
                unit,
                duration: Math.min(step.duration, MAX_DURATION[unit] ?? 10_080),
              })
            }
            value={step.unit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
