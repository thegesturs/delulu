"use client";

import { OrganizationSwitcher as ClerkOrgSwitcher } from "@delulu/auth";
import { api } from "@delulu/database/convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";

export function OrganizationSwitcher() {
  const orgCheck = useQuery(api.subscriptions.checkCanCreateOrganization);
  const canCreate = orgCheck?.allowed ?? false;

  return (
    <ClerkOrgSwitcher
      afterCreateOrganizationUrl="/"
      afterLeaveOrganizationUrl="/"
      afterSelectOrganizationUrl="/"
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger:
            "w-full justify-start gap-2 p-2 rounded-md hover:bg-sidebar-accent",
        },
      }}
      createOrganizationMode={canCreate ? "modal" : "navigation"}
      createOrganizationUrl={canCreate ? undefined : "/billing"}
      hidePersonal={false}
      organizationProfileMode="modal"
    />
  );
}
