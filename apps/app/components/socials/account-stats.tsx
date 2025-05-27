'use client';

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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="rounded-xl border-border bg-card/60 p-4 backdrop-blur-sm">
        <div className="font-bold text-2xl text-foreground">{stats.total}</div>
        <div className="text-muted-foreground text-sm">Total Accounts</div>
      </div>
      <div className="rounded-xl border-border bg-card/60 p-4 backdrop-blur-sm">
        <div className="font-bold text-2xl text-green-600">{stats.active}</div>
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
  );
}
