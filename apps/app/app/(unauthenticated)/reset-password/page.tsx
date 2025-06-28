import { ResetPassword } from '@/components/auth/reset-password';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Reset Password';
const description = 'Enter your new password to reset your account.';

export const metadata: Metadata = createMetadata({ title, description });

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const ResetPasswordPage = async ({ searchParams }: ResetPasswordPageProps) => {
  const token = (await searchParams).token;

  return <ResetPassword token={token} redirectTo="/sign-in" />;
};

export default ResetPasswordPage;
