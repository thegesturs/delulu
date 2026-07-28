import { render } from "@react-email/render";
import { createElement } from "react";
import {
  MigrationRecoveryEmail,
  type MigrationRecoveryEmailProps,
  migrationRecoveryEmailSubject,
} from "../templates/migration-recovery";

export interface RenderedEmail {
  readonly html: string;
  readonly subject: string;
  readonly text: string;
}

export const renderMigrationRecoveryEmail = async (
  input: MigrationRecoveryEmailProps
): Promise<RenderedEmail> => {
  const greeting = input.firstName?.trim() || "there";
  const html = await render(createElement(MigrationRecoveryEmail, input));
  const text = `Hi ${greeting},

Over the past few weeks, Delulu Social went through a major migration. It caused more errors and rough edges than it should have—especially for people who had just joined.

That wasn’t the experience we wanted you to have, and we’re sorry.

To make it right, we’re giving you two months of Delulu Social free.

${
  input.offer.kind === "discount"
    ? `Your two-month code: ${input.offer.discountCode}
Valid on a monthly plan through ${input.offer.expiresOn}

Redeem your two free months: ${input.offer.billingUrl}`
    : "Your two free months are already applied. We moved your next billing date out by two months, and you don’t need to do anything."
}

Want help getting set up? We’re happy to walk through Delulu Social with you one-on-one:
${input.bookingUrl}

Thanks for sticking with us while we make Delulu Social faster, more reliable, and easier to use.

— Swaraj
Founder, Delulu Social

Manage email preferences: ${input.preferencesUrl}`;

  return { html, subject: migrationRecoveryEmailSubject, text };
};
