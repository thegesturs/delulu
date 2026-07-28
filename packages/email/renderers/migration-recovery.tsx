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
  const email = createElement(MigrationRecoveryEmail, input);
  const [html, text] = await Promise.all([
    render(email),
    render(email, {
      htmlToTextOptions: {
        selectors: [
          {
            format: "skip",
            selector: 'div[style*="display:none"]',
          },
          {
            format: "skip",
            selector: "img",
          },
          {
            format: "skip",
            selector: "hr",
          },
        ],
      },
      plainText: true,
    }),
  ]);

  return { html, subject: migrationRecoveryEmailSubject, text };
};
