import { keys } from '@delulu/api/keys';
import { signState } from '@delulu/api/utils/oauth-state';
import { nanoid } from 'nanoid';
import { auth } from 'twitter-api-sdk';
// Define TwitterError locally since we only need this one error
class TwitterError extends Error {
	readonly code = 'TWITTER_ERROR';
	readonly provider = 'Twitter';

	constructor(message: string) {
		super(message);
		this.name = 'TwitterError';
	}
}

export interface ConnectUrlProvider {
	connectUrl: (userId: string) => Promise<string>;
}

/**
 * Generate Twitter OAuth URL
 */
const generateTwitterConnectUrl = async (userId: string): Promise<string> => {
	try {
		// Generate signed state with user session info
		const state = await signState({
			userId,
			nonce: nanoid(10),
			timestamp: Date.now(),
		});

		const authClient = new auth.OAuth2User({
			client_id: keys().TWITTER_CLIENT_ID,
			client_secret: keys().TWITTER_CLIENT_SECRET,
			callback: keys().TWITTER_CALLBACK_URL,
			scopes: ['users.read', 'tweet.read', 'offline.access', 'tweet.write'],
		});

		const url = authClient.generateAuthURL({
			state,
			code_challenge_method: 'plain',
			code_challenge: 'challenge',
		});

		return url;
	} catch {
		throw new TwitterError('Failed to generate OAuth URL');
	}
};

export const connectUrlRegistry = {
	TWITTER: {
		connectUrl: (userId: string) => generateTwitterConnectUrl(userId),
	},
	LINKEDIN: {
		connectUrl: async (userId: string) => {
			const state = await signState({
				userId,
				nonce: nanoid(10),
				timestamp: Date.now(),
			});

			const scopes = [
				'r_basicprofile',
				'r_member_postAnalytics',
				'w_member_social',
				'w_organization_social',
			].join('%20');

			const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${keys().LINKEDIN_CLIENT_ID}&redirect_uri=${keys().LINKEDIN_CALLBACK_URL}&scope=${scopes}&state=${state}`;
			return url;
		},
	},
	TIKTOK: {
		connectUrl: async (userId: string) => {
			const state = await signState({
				userId,
				nonce: nanoid(10),
				timestamp: Date.now(),
			});

			const params = new URLSearchParams({
				response_type: 'code',
				client_key: keys().TIKTOK_CLIENT_ID,
				redirect_uri: keys().TIKTOK_CALLBACK_URL,
				scope: 'user.info.basic,video.publish,video.upload,user.info.profile',
				state,
			});

			return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
		},
	},
	INSTAGRAM: {
		connectUrl: async (userId: string) => {
			const state = await signState({
				userId,
				nonce: nanoid(10),
				timestamp: Date.now(),
			});

			const params = new URLSearchParams({
				client_id: keys().INSTAGRAM_CLIENT_ID,
				redirect_uri: keys().INSTAGRAM_CALLBACK_URL,
				response_type: 'code',
				scope: [
					'instagram_business_basic',
					'instagram_business_content_publish',
				].join(','),
				state,
			});

			return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
		},
	},
	THREADS: {
		connectUrl: async (userId: string) => {
			const state = await signState({
				userId,
				nonce: nanoid(10),
				timestamp: Date.now(),
			});

			const params = new URLSearchParams({
				client_id: keys().THREADS_CLIENT_ID,
				redirect_uri: keys().THREADS_CALLBACK_URL,
				response_type: 'code',
				scope: ['threads_basic', 'threads_content_publish'].join(','),
				state,
			});

			return `https://threads.net/oauth/authorize?${params.toString()}`;
		},
	},
	FACEBOOK: {
		connectUrl: async (userId: string) => {
			const state = await signState({
				userId,
				nonce: nanoid(10),
				timestamp: Date.now(),
			});

			const params = new URLSearchParams({
				client_id: keys().FACEBOOK_CLIENT_ID,
				redirect_uri: keys().FACEBOOK_CALLBACK_URL,
				response_type: 'code',
				scope: [
					'public_profile',
					'pages_show_list',
					'pages_manage_posts',
					'business_management',
					'publish_video',
				].join(','),
				state,
			});

			return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
		},
	},
	PINTEREST: {
		connectUrl: async (userId: string) => {
			const state = await signState({
				userId,
				nonce: nanoid(10),
				timestamp: Date.now(),
			});

			const params = new URLSearchParams({
				client_id: keys().PINTEREST_CLIENT_ID,
				redirect_uri: keys().PINTEREST_CALLBACK_URL,
				response_type: 'code',
				scope: 'boards:read,pins:write',
				state,
			});

			return `https://www.pinterest.com/oauth/?${params.toString()}`;
		},
	},
	FARCASTER: {
		connectUrl: async (_userId: string) => {
			// Farcaster uses a different auth flow through Warpcast
			// This would typically redirect to Warpcast for signer approval
			// No state parameter needed for this flow
			return 'https://warpcast.com/~/developers/signed-key-requests';
		},
	},
	YOUTUBE: {
		connectUrl: async (userId: string) => {
			const state = await signState({
				userId,
				nonce: nanoid(10),
				timestamp: Date.now(),
			});

			const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
			const params = new URLSearchParams({
				client_id: keys().GOOGLE_CLIENT_ID,
				redirect_uri: keys().YOUTUBE_CALLBACK_URL,
				response_type: 'code',
				scope: [
					'https://www.googleapis.com/auth/youtube.upload',
					'https://www.googleapis.com/auth/youtube.readonly',
					'https://www.googleapis.com/auth/userinfo.profile',
				].join(' '),
				access_type: 'offline',
				prompt: 'consent',
				state,
			});

			return `${baseUrl}?${params}`;
		},
	},
	BLUESKY: {
		connectUrl: async (userId: string) => {
			const state = await signState({
				userId,
				nonce: nanoid(10),
				timestamp: Date.now(),
			});

			// Bluesky OAuth URL - uses client metadata URL as client_id
			const params = new URLSearchParams({
				client_id: 'https://delulu.social/oauth/bluesky-client.json', // Client metadata URL
				redirect_uri: 'https://delulu.social/api/callback/bluesky',
				response_type: 'code',
				scope: 'atproto transition:generic',
				code_challenge_method: 'S256',
				state,
				// code_challenge would be generated dynamically in real implementation
			});

			return `https://bsky.social/oauth/authorize?${params.toString()}`;
		},
	},
};
