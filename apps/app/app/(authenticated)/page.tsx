import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="min-h-screen overflow-auto bg-background">
      <DashboardClient />
    </div>
  );
}
