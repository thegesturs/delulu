import { auth } from '@delulu/auth/server';
import { toNextJsHandler } from '@delulu/auth/server';

const { POST: originalPOST, GET: originalGET } = toNextJsHandler(auth);

export const POST = async (req: Request) => {
  return originalPOST(req).catch((error) => {
    console.error('Error in POST request to auth endpoint', error);
    return new Response('Internal Server Error', { status: 500 });
  });
};

export const GET = async (req: Request) => {
  return originalGET(req).catch((error) => {
    console.error('Error in GET request to auth endpoint', error);
    return new Response('Internal Server Error', { status: 500 });
  });
};
