"use client";

interface AccountStatsProps {
  stats: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
  };
}

const statItems = [
  {
    key: "total" as const,
    label: "Total",
    color: "text-foreground",
    bg: "bg-muted",
  },
  {
    key: "active" as const,
    label: "Active",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    key: "expiring" as const,
    label: "Expiring",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    key: "expired" as const,
    label: "Expired",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
];

export function AccountStats({ stats }: AccountStatsProps) {
  return (
    <>
      {/* Mobile: badges */}
      <div className="flex flex-wrap gap-2 md:hidden">
        {statItems.map((item) => (
          <div
            className={`flex items-center gap-1.5 rounded-full ${item.bg} px-2.5 py-1`}
            key={item.key}
          >
            <span className={`font-medium text-xs ${item.color}`}>
              {stats[item.key]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop: cards */}
      <div className="hidden gap-4 md:grid md:grid-cols-4">
        <div className="rounded-xl border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className="font-bold text-2xl text-foreground">
            {stats.total}
          </div>
          <div className="text-muted-foreground text-sm">Total Accounts</div>
        </div>
        <div className="rounded-xl border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className="font-bold text-2xl text-green-600">
            {stats.active}
          </div>
          <div className="text-muted-foreground text-sm">Active</div>
        </div>
        <div className="rounded-xl border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className="font-bold text-2xl text-yellow-600">
            {stats.expiring}
          </div>
          <div className="text-muted-foreground text-sm">Expiring Soon</div>
        </div>
        <div className="rounded-xl border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className="font-bold text-2xl text-red-600">{stats.expired}</div>
          <div className="text-muted-foreground text-sm">Expired</div>
        </div>
      </div>
    </>
  );
}
