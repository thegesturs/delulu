"use client";

import {
  StatRow,
  StatTile,
} from "@delulu/design-system/components/ui/stat-row";

interface AccountStatsProps {
  stats: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
  };
}

export function AccountStats({ stats }: AccountStatsProps) {
  return (
    <div>
      <StatRow columns={4}>
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Active" value={stats.active} />
        <StatTile
          hint={stats.expiring > 0 ? "Expiring soon" : undefined}
          label="Expiring"
          value={stats.expiring}
        />
        <StatTile
          hint={stats.expired > 0 ? "Reconnect from the menu" : undefined}
          label="Expired"
          value={stats.expired}
        />
      </StatRow>
    </div>
  );
}
