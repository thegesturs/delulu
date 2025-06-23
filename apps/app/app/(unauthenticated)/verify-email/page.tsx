import { VerifyEmail } from '@/components/auth/verify-email';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Verify Email';
const description = 'Verify your email address to complete your account setup.';

export const metadata: Metadata = createMetadata({ title, description });

type VerifyEmailPageProps = {
  searchParams: { token?: string };
};

const VerifyEmailPage = ({ searchParams }: VerifyEmailPageProps) => {
  const token = searchParams.token;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <VerifyEmail token={token} redirectTo="/sign-in" />
    </div>
  );
};

export default VerifyEmailPage;
