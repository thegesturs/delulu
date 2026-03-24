"use client";

import { OrganizationSwitcher as ClerkOrgSwitcher } from "@delulu/auth";
import { api } from "@delulu/database/convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";

const sharedProps = {
  hidePersonal: false,
  afterCreateOrganizationUrl: "/",
  afterLeaveOrganizationUrl: "/",
  afterSelectOrganizationUrl: "/",
  organizationProfileMode: "modal" as const,
  appearance: {
    elements: {
      rootBox: "w-full",
      organizationSwitcherTrigger:
        "w-full justify-start gap-2 p-2 rounded-md hover:bg-sidebar-accent",
    },
  },
};

export function OrganizationSwitcher() {
  const orgCheck = useQuery(api.subscriptions.checkCanCreateOrganization);
  const canCreate = orgCheck?.allowed ?? false;

  if (canCreate) {
    return <ClerkOrgSwitcher {...sharedProps} createOrganizationMode="modal" />;
  }

  return (
    <ClerkOrgSwitcher
      {...sharedProps}
      createOrganizationMode="navigation"
      createOrganizationUrl="/billing"
    />
  );
}
