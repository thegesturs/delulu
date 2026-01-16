/**
 * OAuth Callback Helper
 *
 * Shared utilities for OAuth callback handlers to recover user sessions
 * from signed state parameters when Clerk session is lost during redirects
 */

import { auth, clerkClient } from '@delulu/auth/server';
import { verifyState } from '@delulu/api/utils/oauth-state';
import type { NextRequest } from 'next/server';

export interface OAuthSessionResult {
	userId: string;
	token: string | null;
	useInternalMutation: boolean; // true when token unavailable (local dev)
	sessionRecovered: boolean; // true if session was recovered from state
}

export interface OAuthSessionError {
	error:
		| 'missing_params'
		| 'invalid_state'
		| 'session_mismatch'
		| 'token_error';
	code: string;
	message: string;
}

/**
 * Verify OAuth state and recover user session/token
 *
 * This function:
 * 1. Validates the OAuth state parameter
 * 2. Extracts userId from the signed state
 * 3. Attempts to get Clerk session and Convex token
 * 4. Falls back to generating token from userId if Clerk session is lost
 *
 * @param request - Next.js request object
 * @param provider - Social provider name (for error messages)
 * @returns Result object with userId and token, or error object
 */
export async function verifyOAuthStateAndRecoverSession(
	request: NextRequest,
	provider: string,
): Promise<
	| { success: true; data: OAuthSessionResult }
	| { success: false; error: OAuthSessionError }
> {
	// Step 1: Get code and state parameters
	const { searchParams } = new URL(request.url);
	const code = searchParams.get('code');
	const stateParam = searchParams.get('state');

	if (!stateParam || !code) {
		return {
			success: false,
			error: {
				error: 'missing_params',
				code: 'PARAM_001',
				message: 'Missing required OAuth parameters',
			},
		};
	}

	// Step 2: Verify state and extract userId
	let userId: string;
	try {
		const statePayload = await verifyState(stateParam);
		userId = statePayload.userId;
		console.log(`[${provider}] Recovered userId from state:`, userId);
	} catch (error) {
		console.error(`[${provider}] State verification failed:`, error);
		return {
			success: false,
			error: {
				error: 'invalid_state',
				code: 'STATE_001',
				message: 'Invalid or expired OAuth state',
			},
		};
	}

	// Step 3: Try to get userId from Clerk session (preferred)
	const { userId: clerkUserId, getToken } = await auth();

	// Security check: If Clerk session exists, it must match state userId
	if (clerkUserId && clerkUserId !== userId) {
		console.error(`[${provider}] Session mismatch:`, {
			clerkUserId,
			stateUserId: userId,
		});
		return {
			success: false,
			error: {
				error: 'session_mismatch',
				code: 'AUTH_002',
				message: 'Session user does not match OAuth state',
			},
		};
	}

	// Step 4: Get Convex token (or skip for local dev)
	let token: string | null = null;
	let sessionRecovered = false;
	let useInternalMutation = false;

	if (clerkUserId) {
		// Clerk session exists (production scenario)
		console.log(`[${provider}] Using active Clerk session`);
		token = await getToken({ template: 'convex' });
		sessionRecovered = false;
		useInternalMutation = false;
	} else {
		// Clerk session lost
		// Only allow unauthenticated mutations in development
		if (process.env.NODE_ENV === 'production') {
			console.error(`[${provider}] Session lost in production - this should not happen`);
			return {
				success: false,
				error: {
					error: 'token_error',
					code: 'AUTH_004',
					message: 'Authentication required in production',
				},
			};
		}

		// Local dev with tunnel URL - use OAuth mutation without auth
		console.log(`[${provider}] Session lost (local dev), will use OAuth mutation without token`);
		token = null;
		sessionRecovered = true;
		useInternalMutation = true;
	}

	return {
		success: true,
		data: {
			userId,
			token,
			useInternalMutation,
			sessionRecovered,
		},
	};
}
