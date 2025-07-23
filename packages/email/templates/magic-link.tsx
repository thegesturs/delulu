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

type MagicLinkEmailProps = {
  readonly url: string;
};

export const MagicLinkEmail = ({ url }: MagicLinkEmailProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>Sign in to your account</Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Section className="mt-8 rounded-md bg-zinc-200 p-px">
            <Section className="rounded-[5px] bg-white p-8">
              <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
                Sign in to your account
              </Text>
              <Text className="m-0 mb-4 text-zinc-500">
                Click the button below to sign in to your account. This link
                will expire in 10 minutes.
              </Text>
              <Button
                className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-sm text-white"
                href={url}
              >
                Sign In
              </Button>
              <Hr className="my-4" />
              <Text className="text-xs text-zinc-400">
                If you didn't request this email, you can safely ignore it.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

const ExampleMagicLinkEmail = () => (
  <MagicLinkEmail url="https://example.com/signin?token=abc123" />
);

export default ExampleMagicLinkEmail;
