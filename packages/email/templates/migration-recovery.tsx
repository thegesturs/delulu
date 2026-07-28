import { Heading, Link, Section, Text } from "@react-email/components";
import React from "react";
import {
  DeluluEmailLayout,
  emailTheme,
} from "../components/delulu-email-layout";

export interface MigrationRecoveryEmailProps {
  readonly bookingUrl: string;
  readonly firstName?: string | null;
  readonly offer:
    | {
        readonly billingUrl: string;
        readonly discountCode: string;
        readonly expiresOn: string;
        readonly kind: "discount";
      }
    | {
        readonly kind: "subscription-extension";
      };
  readonly preferencesUrl: string;
}

export const migrationRecoveryEmailSubject =
  "Delulu Social migration follow-up";
export const migrationRecoveryEmailPreview =
  "Details about the recent migration and your account credit.";

export const MigrationRecoveryEmail = ({
  bookingUrl,
  firstName,
  offer,
  preferencesUrl,
}: MigrationRecoveryEmailProps) => {
  const greeting = firstName?.trim() || "there";

  return (
    <DeluluEmailLayout
      preferencesUrl={preferencesUrl}
      preview={migrationRecoveryEmailPreview}
    >
      <Section
        style={{
          backgroundColor: emailTheme.surface,
          borderBottom: `1.5px dotted ${emailTheme.dotted}`,
          padding: "32px 28px 28px",
        }}
      >
        <Text
          style={{
            color: emailTheme.primary,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            margin: "0 0 14px",
            textTransform: "uppercase",
          }}
        >
          Service update
        </Text>

        <Heading
          as="h1"
          style={{
            color: emailTheme.foreground,
            fontSize: "30px",
            letterSpacing: "-0.025em",
            lineHeight: "38px",
            margin: "0 0 24px",
          }}
        >
          An update on our recent migration.
        </Heading>

        <Text style={paragraph}>Hi {greeting},</Text>
        <Text style={paragraph}>
          Over the past few weeks, Delulu Social went through a major migration
          that caused stability problems, especially for people who had just
          joined.
        </Text>
        <Text style={paragraph}>
          That wasn’t the experience we wanted you to have, and we’re sorry.
        </Text>
        <Text style={{ ...paragraph, marginBottom: 0 }}>
          We’ve added a <strong>two-month service credit</strong> for your
          account.
        </Text>
      </Section>

      {offer.kind === "discount" ? (
        <Section style={panel}>
          <Text
            style={{
              color: emailTheme.muted,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              margin: "0 0 10px",
              textTransform: "uppercase",
            }}
          >
            Account credit
          </Text>
          <Text
            style={{
              color: emailTheme.foreground,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              margin: "0 0 10px",
            }}
          >
            {offer.discountCode}
          </Text>
          <Text
            style={{
              color: emailTheme.muted,
              fontSize: "13px",
              lineHeight: "20px",
              margin: "0 0 14px",
            }}
          >
            Use this code on a monthly plan by {offer.expiresOn}.
          </Text>
          <Link
            href={offer.billingUrl}
            style={{
              color: emailTheme.primary,
              display: "inline-block",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: "20px",
              padding: "12px 0",
              textDecoration: "underline",
            }}
          >
            Open billing settings
          </Link>
        </Section>
      ) : (
        <Section style={panel}>
          <Text
            style={{
              color: emailTheme.foreground,
              fontSize: "17px",
              fontWeight: 700,
              lineHeight: "25px",
              margin: "0 0 8px",
            }}
          >
            Your service credit is already applied.
          </Text>
          <Text
            style={{
              color: emailTheme.muted,
              fontSize: "14px",
              lineHeight: "22px",
              margin: 0,
            }}
          >
            We moved your next billing date out by two months. You don’t need to
            do anything.
          </Text>
        </Section>
      )}

      <Section
        style={{
          backgroundColor: emailTheme.background,
          borderBottom: `1.5px dotted ${emailTheme.dotted}`,
          padding: "24px 28px",
        }}
      >
        <Text
          style={{
            color: emailTheme.foreground,
            fontSize: "15px",
            fontWeight: 700,
            lineHeight: "22px",
            margin: "0 0 6px",
          }}
        >
          Need a hand?
        </Text>
        <Text
          style={{
            color: emailTheme.muted,
            fontSize: "14px",
            lineHeight: "22px",
            margin: 0,
          }}
        >
          If you ran into migration issues or want help getting set up, we can
          walk through Delulu Social with you.{" "}
          <Link
            href={bookingUrl}
            style={{ color: emailTheme.primary, fontWeight: 600 }}
          >
            Schedule a call
          </Link>
          .
        </Text>
      </Section>

      <Section
        style={{
          backgroundColor: emailTheme.surface,
          padding: "28px",
        }}
      >
        <Text style={paragraph}>
          Thanks for sticking with us while we make Delulu Social faster, more
          reliable, and easier to use.
        </Text>
        <Text style={{ ...paragraph, marginBottom: 0 }}>
          — Swaraj
          <br />
          Founder, Delulu Social
        </Text>
      </Section>
    </DeluluEmailLayout>
  );
};

const panel = {
  backgroundColor: emailTheme.surface,
  borderBottom: `1.5px dotted ${emailTheme.dotted}`,
  padding: "24px 28px",
} as const;

const paragraph = {
  color: emailTheme.foreground,
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 18px",
} as const;

const ExampleMigrationRecoveryEmail = () => (
  <MigrationRecoveryEmail
    bookingUrl="https://cal.com/swaraj"
    firstName="Swaraj"
    offer={{
      billingUrl: "https://solulu.delulu.social/billing",
      discountCode: "DELULU2MONTHS",
      expiresOn: "August 31, 2026",
      kind: "discount",
    }}
    preferencesUrl="https://solulu.delulu.social/workspace"
  />
);

export default ExampleMigrationRecoveryEmail;
