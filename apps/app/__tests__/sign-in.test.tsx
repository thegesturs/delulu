import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { SignIn } from '../components/auth/sign-in';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock auth client
vi.mock('@delulu/auth/client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
  },
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
  },
}));

test('Sign In Page', async () => {
  render(<SignIn />);
  
  await waitFor(() => {
    expect(screen.getByText('Welcome back')).toBeDefined();
  });
});
