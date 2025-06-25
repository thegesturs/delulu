import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Page from '../app/(unauthenticated)/sign-in/[[...sign-in]]/page';

test('Sign In Page', () => {
  render(<Page searchParams={Promise.resolve({ redirect_to: '/' })} />);
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Welcome back',
    })
  ).toBeDefined();
});
