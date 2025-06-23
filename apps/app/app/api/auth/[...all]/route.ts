import { auth } from '@delulu/auth/server';
import { toNextJsHandler } from '@delulu/auth/server';

const handler = toNextJsHandler(auth);

export { handler as GET, handler as POST };
