import { SignUp } from '@/components/auth/sign-up';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Create Account';
const description = 'Create your account to get started.';

export const metadata: Metadata = createMetadata({ title, description });

const SignUpPage = () => {
  return <SignUp />;
};

export default SignUpPage;
