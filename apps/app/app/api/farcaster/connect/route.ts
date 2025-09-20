import { keys } from '@delulu/api/keys';
import { auth } from '@delulu/auth/server';
import { ethers } from 'ethers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

interface SignedKeyRequestResponse {
  result: {
    signedKeyRequest: {
      token: string;
      deeplinkUrl: string;
      key: string;
      requestFid: string;
    };
  };
}

interface SignerStatusResponse {
  result: {
    signedKeyRequest: {
      token: string;
      deeplinkUrl: string;
      key: string;
      state: 'pending' | 'approved' | 'completed';
      userFid?: string;
      signerUser?: {
        fid: number;
        username: string;
        displayName: string;
        pfp: {
          url: string;
        };
        profile: {
          bio: {
            text: string;
          };
        };
      };
    };
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = TIMEOUT_MS
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (_error) {
    clearTimeout(id);
    throw new Error('Request timed out');
  }
}

// Production-level Farcaster signer request with proper EIP-712 signature
export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate a real Ed25519 keypair using Node.js crypto
    const crypto = await import('node:crypto');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    // Extract the raw 32-byte Ed25519 public key from DER format
    const publicKeyRaw = publicKey.subarray(-32);
    const ed25519PublicKey = `0x${publicKeyRaw.toString('hex')}`;
    const privateKeyHex = privateKey.toString('hex');

    console.log('🔑 Generated Ed25519 keypair:');
    console.log('  Public Key:', ed25519PublicKey);
    console.log('  Private Key Length:', privateKeyHex.length, 'chars');

    // For EIP-712 signing, we need an Ethereum wallet
    const ethWallet = ethers.Wallet.createRandom();
    console.log('🔐 Generated Ethereum wallet for signing:');
    console.log('  Address:', ethWallet.address);

    // Create the signed key request with proper EIP-712 signature
    const requestFid = Number.parseInt(keys().FARCASTER_APP_FID);
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours

    console.log('📋 Request parameters:');
    console.log('  Request FID:', requestFid);
    console.log(
      '  Deadline:',
      deadline,
      '(',
      new Date(deadline * 1000).toISOString(),
      ')'
    );

    // EIP-712 domain for Farcaster SignedKeyRequestValidator
    const domain = {
      name: 'Farcaster SignedKeyRequestValidator',
      version: '1',
      chainId: 10, // Optimism
      verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553',
    };

    // EIP-712 types - original correct structure for the signature itself
    const types = {
      SignedKeyRequest: [
        { name: 'requestFid', type: 'uint256' },
        { name: 'key', type: 'bytes' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    // Message to sign - this is what gets signed, not the metadata
    const message = {
      requestFid: requestFid,
      key: ed25519PublicKey,
      deadline: deadline,
    };

    console.log('📝 EIP-712 Domain:', JSON.stringify(domain, null, 2));
    console.log('📝 EIP-712 Types:', JSON.stringify(types, null, 2));
    console.log('📝 Message to sign:', JSON.stringify(message, null, 2));

    // Sign the message with EIP-712
    const signature = await ethWallet.signTypedData(domain, types, message);
    console.log('✍️ Generated EIP-712 signature:', signature);

    // Create the signed key request with the exact structure from official docs
    const requestBody = {
      key: ed25519PublicKey,
      requestFid,
      deadline,
      signature,
    };

    console.log(
      '📤 Request body to Warpcast:',
      JSON.stringify(requestBody, null, 2)
    );

    const response = await fetchWithTimeout(
      'https://api.warpcast.com/v2/signed-key-requests',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('📡 Warpcast API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create signer request:', errorText);
      return NextResponse.json(
        { error: 'Failed to create signer request', details: errorText },
        { status: 500 }
      );
    }

    const data = (await response.json()) as SignedKeyRequestResponse;
    console.log('✅ Warpcast API Response:', JSON.stringify(data, null, 2));

    const { token, deeplinkUrl } = data.result.signedKeyRequest;
    console.log('🎯 Extracted values:');
    console.log('  Token:', token);
    console.log('  Deeplink URL:', deeplinkUrl);

    // // Store the pending request with real keys
    // await database.farcasterSignerRequest.create({
    //   data: {
    //     id: `farcaster_${nanoid(12)}`,
    //     token,
    //     publicKey: ed25519PublicKey,
    //     privateKey: privateKeyHex,
    //     deeplinkUrl,
    //     userId,
    //     state: 'pending',
    //     createdAt: new Date(),
    //   },
    // });

    const finalResponse = {
      token,
      deeplinkUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deeplinkUrl)}`,
      // Debug info
      debug: {
        publicKey: ed25519PublicKey,
        privateKeyLength: privateKeyHex.length,
        signature,
        requestFid,
        deadline,
        ethWalletAddress: ethWallet.address,
      },
    };

    console.log('🚀 Final response:', JSON.stringify(finalResponse, null, 2));
    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Farcaster connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check status of signer request
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token parameter required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking status for token:', token);
    console.log('👤 User ID:', userId);

    // // Find the pending request (commented out for testing)
    // const signerRequest = await database.farcasterSignerRequest.findFirst({
    //   where: {
    //     token,
    //     userId,
    //   },
    // });

    // if (!signerRequest) {
    //   return NextResponse.json(
    //     { error: 'Signer request not found' },
    //     { status: 404 }
    //   );
    // }

    // For testing: mock a signer request
    const signerRequest = {
      id: 'mock_signer_request',
      token,
      userId: userId,
      state: 'pending',
    };
    console.log('🎭 Mock signer request:', signerRequest);

    // Check status with Warpcast
    const response = await fetchWithTimeout(
      `https://api.warpcast.com/v2/signed-key-request?token=${token}`,
      {
        method: 'GET',
      }
    );

    console.log('response', response);

    if (!response.ok) {
      console.error('Failed to check signer status:', await response.text());
      return NextResponse.json(
        { error: 'Failed to check status' },
        { status: 500 }
      );
    }

    const data = (await response.json()) as SignerStatusResponse;
    console.log('📊 Status check response:', JSON.stringify(data, null, 2));

    const { state, userFid, signerUser } = data.result.signedKeyRequest;
    console.log('🔄 Extracted status:', { state, userFid });
    console.log('👤 Signer user:', signerUser);

    // // Update the request state (commented out for testing)
    // await database.farcasterSignerRequest.update({
    //   where: { id: signerRequest.id },
    //   data: { state, userFid },
    // });

    if (state === 'completed' && signerUser && userFid) {
      console.log('✅ Connection completed! Would create social provider:', {
        userId: userId,
        profileId: userFid,
        displayName: signerUser.displayName,
        username: signerUser.username,
        profileImage: signerUser.pfp.url,
      });

      // // Create the social provider connection (commented out for testing)
      // await database.socialProvider.upsert({
      //   where: {
      //     userId_profileId: {
      //       userId,
      //       profileId: userFid,
      //     },
      //   },
      //   create: {
      //     id: `social_${nanoid(12)}`,
      //     accessToken: token, // Using token as signer UUID
      //     fullName: signerUser.displayName,
      //     username: signerUser.username,
      //     profileImage: signerUser.pfp.url,
      //     expiresIn: new Date(Date.now() + 3600 * 1000),
      //     profileId: userFid,
      //     userId,
      //     socialType: 'FARCASTER',
      //     isActive: true,
      //     lastSyncedAt: new Date(),
      //   },
      //   update: {
      //     accessToken: token,
      //     fullName: signerUser.displayName,
      //     username: signerUser.username,
      //     profileImage: signerUser.pfp.url,
      //     updatedAt: new Date(),
      //     lastSyncedAt: new Date(),
      //     isActive: true,
      //   },
      // });

      // // Clean up the signer request (commented out for testing)
      // await database.farcasterSignerRequest.delete({
      //   where: { id: signerRequest.id },
      // });
    }

    return NextResponse.json({
      state,
      userFid,
      user: signerUser,
    });
  } catch (error) {
    console.error('Farcaster status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
