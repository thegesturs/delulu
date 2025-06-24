import { ForgotPassword } from '@/components/auth/forgot-password';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Forgot Password';
const description = 'Reset your password to regain access to your account.';

export const metadata: Metadata = createMetadata({ title, description });

const ForgotPasswordPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <ForgotPassword />
    </div>
  );
};

export default ForgotPasswordPage;
