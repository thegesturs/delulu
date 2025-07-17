import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { SignUp } from '../components/auth/sign-up';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock auth client
vi.mock('@delulu/auth/client', () => ({
  signIn: {
    social: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
}));

test('Sign Up Page', async () => {
  render(<SignUp />);

  await waitFor(() => {
    expect(screen.getByText('Create your account')).toBeDefined();
  });
});
