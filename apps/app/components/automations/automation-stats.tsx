"use client";

import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  AiChat02Icon,
  Cancel01Icon,
  MailSend01Icon,
  TickDouble01Icon,
} from "@hugeicons-pro/core-solid-rounded";

interface AutomationStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalDMsSent: number;
  };
}

export function AutomationStats({ stats }: AutomationStatsProps) {
  const statItems = [
    {
      label: "Total Automations",
      value: stats.total,
      icon: AiChat02Icon,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Active",
      value: stats.active,
      icon: TickDouble01Icon,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      icon: Cancel01Icon,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-900/30",
    },
    {
      label: "DMs Sent",
      value: stats.totalDMsSent,
      icon: MailSend01Icon,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <>
      {/* Mobile: inline badges */}
      <div className="flex flex-wrap gap-2 md:hidden">
        {statItems.map((item) => (
          <div
            className={`flex items-center gap-1.5 rounded-full ${item.bgColor} px-2.5 py-1`}
            key={item.label}
          >
            <Icon className={item.color} icon={item.icon} size={12} />
            <span className="font-medium text-xs">{item.value}</span>
            <span className="text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop: cards */}
      <div className="hidden gap-3 md:grid md:grid-cols-4">
        {statItems.map((item) => (
          <Card className="border-border/50" key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgColor}`}
              >
                <Icon className={item.color} icon={item.icon} size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xl">
                  {item.value}
                </p>
                <p className="text-muted-foreground text-xs">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
