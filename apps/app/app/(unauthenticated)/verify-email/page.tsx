import { VerifyEmail } from '@/components/auth/verify-email';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Verify Email';
const description = 'Verify your email address to complete your account setup.';

export const metadata: Metadata = createMetadata({ title, description });

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const VerifyEmailPage = async ({ searchParams }: VerifyEmailPageProps) => {
  const token = (await searchParams).token;

  return <VerifyEmail token={token} redirectTo="/sign-in" />;
};

export default VerifyEmailPage;
