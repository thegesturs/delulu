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

Over the past few weeks, Delulu Social went through a major migration that caused stability problems, especially for people who had just joined.

That wasn’t the experience we wanted you to have, and we’re sorry.

We’ve added a two-month service credit for your account.

${
  input.offer.kind === "discount"
    ? `Account credit code: ${input.offer.discountCode}
Use this code on a monthly plan by ${input.offer.expiresOn}.

Open billing settings: ${input.offer.billingUrl}`
    : "Your service credit is already applied. We moved your next billing date out by two months, and you don’t need to do anything."
}

If you ran into migration issues or want help getting set up, we can walk through Delulu Social with you:
${input.bookingUrl}

Thanks for sticking with us while we make Delulu Social faster, more reliable, and easier to use.

— Swaraj
Founder, Delulu Social

Manage email preferences: ${input.preferencesUrl}`;

  return { html, subject: migrationRecoveryEmailSubject, text };
};
