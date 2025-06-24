import { auth } from '@delulu/auth/server';
import { toNextJsHandler } from '@delulu/auth/server';

export const { GET, POST } = toNextJsHandler(auth.handler);
