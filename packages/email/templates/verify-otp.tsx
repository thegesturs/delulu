import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface VerifyOTPProps {
  readonly code: string;
}

export const VerifyOTP = ({ code }: VerifyOTPProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>Your verification code: {code}</Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Section className="mt-8 rounded-md bg-zinc-200 p-px">
            <Section className="rounded-[5px] bg-white p-8">
              <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
                Your verification code
              </Text>
              <Text className="m-0 mb-4 text-zinc-500">
                Enter the following code to verify your email address:
              </Text>
              <Section className="py-4 text-center">
                <Text className="inline-block rounded-md bg-zinc-100 px-4 py-2 font-bold text-4xl text-zinc-950 tracking-wider">
                  {code}
                </Text>
              </Section>
              <Text className="mb-4 text-sm text-zinc-500">
                This code will expire in 10 minutes.
              </Text>
              <Hr className="my-4" />
              <Text className="text-xs text-zinc-400">
                If you didn't request this code, you can safely ignore this
                email.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

const ExampleVerifyOTP = () => <VerifyOTP code="123456" />;

export default ExampleVerifyOTP;
