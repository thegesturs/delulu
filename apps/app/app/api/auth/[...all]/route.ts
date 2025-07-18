import { nextJsHandler } from '@delulu/auth/server';

export const { GET, POST } = nextJsHandler();

// export const POST = async (req: Request) => {
//   console.log('POST request to auth endpoint');
//   return new Response('OK', { status: 200 });
// };

// export const GET = async (req: Request) => {
//   console.log('GET request to auth endpoint');
//   return new Response('OK', { status: 200 });
// };