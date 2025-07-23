import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

type ResetPasswordEmailProps = {
  readonly url: string;
};

export const ResetPasswordEmail = ({ url }: ResetPasswordEmailProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Section className="mt-8 rounded-md bg-zinc-200 p-px">
            <Section className="rounded-[5px] bg-white p-8">
              <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
                Reset your password
              </Text>
              <Text className="m-0 mb-4 text-zinc-500">
                We received a request to reset your password. Click the button
                below to create a new password.
              </Text>
              <Button
                className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-sm text-white"
                href={url}
              >
                Reset Password
              </Button>
              <Hr className="my-4" />
              <Text className="text-xs text-zinc-400">
                If you didn't request a password reset, you can safely ignore
                this email. This link will expire in 1 hour.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

const ExampleResetPasswordEmail = () => (
  <ResetPasswordEmail url="https://example.com/reset-password?token=abc123" />
);

export default ExampleResetPasswordEmail;
