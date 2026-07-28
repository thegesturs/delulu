import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
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
  dotted: "rgba(9, 9, 11, 0.1)",
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
        <Section
          style={{
            borderBottom: `1.5px dotted ${colors.dotted}`,
            borderLeft: `1.5px dotted ${colors.dotted}`,
            borderRight: `1.5px dotted ${colors.dotted}`,
            padding: "20px 24px",
          }}
        >
          <table
            cellPadding="0"
            cellSpacing="0"
            role="presentation"
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              <tr>
                <td>
                  <Img
                    alt="Delulu"
                    height="32"
                    src="https://solulu.delulu.social/apple-icon.png"
                    style={{
                      borderRadius: "8px",
                      display: "block",
                    }}
                    width="32"
                  />
                </td>
                <td
                  style={{
                    color: colors.foreground,
                    fontSize: "18px",
                    fontWeight: 700,
                    paddingLeft: "10px",
                  }}
                >
                  Delulu
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section
          style={{
            borderLeft: `1.5px dotted ${colors.dotted}`,
            borderRight: `1.5px dotted ${colors.dotted}`,
          }}
        >
          {children}
        </Section>

        <Section
          style={{
            borderTop: `1.5px dotted ${colors.dotted}`,
            padding: "24px 16px 0",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: "12px",
              lineHeight: "18px",
              margin: 0,
            }}
          >
            Delulu Social
          </Text>
          <Hr
            style={{
              border: 0,
              borderTop: `1.5px dotted ${colors.dotted}`,
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
