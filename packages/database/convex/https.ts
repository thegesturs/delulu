import { httpRouter } from 'convex/server';
import { betterAuthComponent } from './auth';
//should import from @delulu/auth/server
import { createAuth } from '../lib/auth';

const http = httpRouter();

betterAuthComponent.registerRoutes(http, createAuth);

export default http;