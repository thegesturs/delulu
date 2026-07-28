import {
  Button,
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from "@react-email/components";
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
  "A note from Delulu Social — and 2 months on us";
export const migrationRecoveryEmailPreview =
  "We’re sorry about the migration issues. Here’s how we’re making it right.";

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
        A note from Delulu Social
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
        We owe you a better start.
      </Heading>

      <Text style={paragraph}>Hi {greeting},</Text>
      <Text style={paragraph}>
        Over the past few weeks, Delulu Social went through a major migration.
        It caused more errors and rough edges than it should have—especially for
        people who had just joined.
      </Text>
      <Text style={paragraph}>
        That wasn’t the experience we wanted you to have, and we’re sorry.
      </Text>
      <Text style={paragraph}>
        To make it right, we’re giving you{" "}
        <strong>two months of Delulu Social free.</strong>
      </Text>

      {offer.kind === "discount" ? (
        <Section
          style={{
            backgroundColor: "#f0f0ff",
            border: "1px solid #cfd1ff",
            borderRadius: "14px",
            margin: "28px 0",
            padding: "24px",
            textAlign: "center",
          }}
        >
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
            Your two-month code
          </Text>
          <Text
            style={{
              color: emailTheme.foreground,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              margin: "0 0 8px",
            }}
          >
            {offer.discountCode}
          </Text>
          <Text
            style={{
              color: emailTheme.muted,
              fontSize: "13px",
              lineHeight: "20px",
              margin: "0 0 20px",
            }}
          >
            Valid on a monthly plan through {offer.expiresOn}
          </Text>
          <Button
            href={offer.billingUrl}
            style={{
              backgroundColor: emailTheme.primary,
              borderRadius: "10px",
              color: emailTheme.primaryForeground,
              display: "inline-block",
              fontSize: "15px",
              fontWeight: 700,
              padding: "14px 22px",
              textDecoration: "none",
            }}
          >
            Redeem two free months
          </Button>
        </Section>
      ) : (
        <Section
          style={{
            backgroundColor: "#f0f0ff",
            border: "1px solid #cfd1ff",
            borderRadius: "14px",
            margin: "28px 0",
            padding: "24px",
          }}
        >
          <Text
            style={{
              color: emailTheme.foreground,
              fontSize: "17px",
              fontWeight: 700,
              lineHeight: "25px",
              margin: "0 0 8px",
            }}
          >
            Your two free months are already applied.
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
          borderLeft: `3px solid ${emailTheme.primary}`,
          margin: "0 0 28px",
          padding: "2px 0 2px 18px",
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
          Want help getting set up?
        </Text>
        <Text
          style={{
            color: emailTheme.muted,
            fontSize: "14px",
            lineHeight: "22px",
            margin: 0,
          }}
        >
          We’re happy to walk through Delulu Social with you one-on-one.{" "}
          <Link
            href={bookingUrl}
            style={{ color: emailTheme.primary, fontWeight: 600 }}
          >
            Book a setup call
          </Link>
          .
        </Text>
      </Section>

      <Hr style={{ borderColor: emailTheme.border, margin: "28px 0" }} />
      <Text style={paragraph}>
        Thanks for sticking with us while we make Delulu Social faster, more
        reliable, and easier to use.
      </Text>
      <Text style={{ ...paragraph, marginBottom: 0 }}>
        — Swaraj
        <br />
        Founder, Delulu Social
      </Text>
    </DeluluEmailLayout>
  );
};

const paragraph = {
  color: emailTheme.foreground,
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 18px",
} as const;

const ExampleMigrationRecoveryEmail = () => (
  <MigrationRecoveryEmail
    bookingUrl="https://cal.com/your-correct-link"
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
