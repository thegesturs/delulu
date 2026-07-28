import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import React from "react";

interface DeluluEmailLayoutProps {
  readonly children: ReactNode;
  readonly preferencesUrl: string;
  readonly preview: string;
}

const colors = {
  background: "#f9f9fb",
  border: "#e0e0eb",
  foreground: "#21212c",
  muted: "#67677e",
  primary: "#474deb",
  primaryForeground: "#f8fafc",
  surface: "#ffffff",
} as const;

export const emailTheme = colors;

export const DeluluEmailLayout = ({
  children,
  preferencesUrl,
  preview,
}: DeluluEmailLayoutProps) => (
  <Html lang="en">
    <Head />
    <Preview>{preview}</Preview>
    <Body
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        margin: 0,
        padding: "32px 12px",
      }}
    >
      <Container style={{ margin: "0 auto", maxWidth: "600px" }}>
        <Section style={{ marginBottom: "20px", padding: "0 4px" }}>
          <table
            cellPadding="0"
            cellSpacing="0"
            role="presentation"
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              <tr>
                <td>
                  <div
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: "10px",
                      color: colors.primaryForeground,
                      fontSize: "17px",
                      fontWeight: 700,
                      height: "36px",
                      lineHeight: "36px",
                      textAlign: "center",
                      width: "36px",
                    }}
                  >
                    D
                  </div>
                </td>
                <td
                  style={{
                    color: colors.foreground,
                    fontSize: "18px",
                    fontWeight: 700,
                    paddingLeft: "10px",
                  }}
                >
                  Delulu Social
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(33, 33, 44, 0.06)",
            padding: "40px",
          }}
        >
          {children}
        </Section>

        <Section style={{ padding: "24px 16px 0", textAlign: "center" }}>
          <Text
            style={{
              color: colors.muted,
              fontSize: "12px",
              lineHeight: "18px",
              margin: 0,
            }}
          >
            Delulu Social · Social media, less chaos.
          </Text>
          <Hr
            style={{
              borderColor: colors.border,
              margin: "16px auto",
              maxWidth: "160px",
            }}
          />
          <Link
            href={preferencesUrl}
            style={{
              color: colors.muted,
              fontSize: "12px",
              textDecoration: "underline",
            }}
          >
            Manage email preferences
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
);
