import { ResetPassword } from '@/components/auth/reset-password';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Reset Password';
const description = 'Enter your new password to reset your account.';

export const metadata: Metadata = createMetadata({ title, description });

type ResetPasswordPageProps = {
  searchParams: { token?: string };
};

const ResetPasswordPage = ({ searchParams }: ResetPasswordPageProps) => {
  const token = searchParams.token;

  return <ResetPassword token={token} redirectTo="/sign-in" />;
};

export default ResetPasswordPage;
