import { SignIn } from '@/components/auth/sign-in';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Welcome back';
const description = 'Enter your details to sign in.';

export const metadata: Metadata = createMetadata({ title, description });

type SignInPageProps = {
  searchParams: Promise<{ redirect_to?: string }>;
};

const SignInPage = async ({ searchParams }: SignInPageProps) => {
  const { redirect_to } = await searchParams;

  return <SignIn redirectTo={redirect_to} />;
};

export default SignInPage;
