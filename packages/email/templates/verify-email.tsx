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

type VerifyEmailProps = {
  readonly url: string;
};

export const VerifyEmail = ({ url }: VerifyEmailProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Section className="mt-8 rounded-md bg-zinc-200 p-px">
            <Section className="rounded-[5px] bg-white p-8">
              <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
                Verify your email address
              </Text>
              <Text className="m-0 mb-4 text-zinc-500">
                Thank you for signing up! To complete your registration, please
                verify your email address by clicking the button below.
              </Text>
              <Button
                className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-sm text-white"
                href={url}
              >
                Verify Email Address
              </Button>
              <Hr className="my-4" />
              <Text className="text-xs text-zinc-400">
                If you didn't create an account, you can safely ignore this
                email.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

const ExampleVerifyEmail = () => (
  <VerifyEmail url="https://example.com/verify?token=abc123" />
);

export default ExampleVerifyEmail;
