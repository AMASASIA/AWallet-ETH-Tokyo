/**
 * WebAuthn (FIDO2 / Passkey) Biometric Authentication Service
 * Supports native Touch ID, Face ID, Windows Hello, and Android Biometrics.
 */

// Helper functions for ArrayBuffer <-> Base64URL conversion
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface RegisteredPasskey {
  credentialId: string;
  publicKeyHex?: string;
  algorithm?: number;
  transports?: string[];
  createdAt: string;
  rpId: string;
  userName: string;
}

export interface WebAuthnAssertionResult {
  success: boolean;
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signatureHex: string;
  userHandleHex?: string;
  rpId: string;
  timestamp: string;
  biometricConfirmed: boolean;
  rawAssertion?: PublicKeyCredential;
}

const STORAGE_KEY_PASSKEY = 'awallet_registered_passkey';

/**
 * Check if WebAuthn & Platform Authenticator (Touch ID, Face ID, Windows Hello) are available.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return isAvailable;
    }
    return true;
  } catch (err) {
    console.warn('[WebAuthn] Platform authenticator availability check failed:', err);
    return false;
  }
}

/**
 * Retrieve any locally saved passkey credential metadata.
 */
export function getSavedPasskey(): RegisteredPasskey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PASSKEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegisteredPasskey;
  } catch {
    return null;
  }
}

/**
 * Register a new Biometric Passkey on this device using WebAuthn.
 * Invokes navigator.credentials.create() with platform authenticator attachment.
 */
export async function registerBiometricPasskey(
  userId: string = 'user-awallet-anchor',
  userName: string = 'AWallet User'
): Promise<RegisteredPasskey> {
  if (typeof window === 'undefined' || !navigator.credentials || !navigator.credentials.create) {
    throw new Error('WebAuthn credentials.create is not supported in this browser environment.');
  }

  // Generate 32-byte cryptographic challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // User ID as bytes
  const enc = new TextEncoder();
  const userIdBytes = enc.encode(userId);

  const rpId = window.location.hostname || 'localhost';

  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'AWallet / Tive ◉AI Security Vault',
      id: rpId,
    },
    user: {
      id: userIdBytes,
      name: userName,
      displayName: userName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256 (P-256) - widely supported
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Enforce Touch ID, Face ID, Windows Hello, etc.
      userVerification: 'required',        // Enforce Biometrics / Device Passcode
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Biometric passkey registration returned empty credential.');
  }

  const rawIdBase64 = bufferToBase64Url(credential.rawId);
  const passkeyData: RegisteredPasskey = {
    credentialId: rawIdBase64,
    createdAt: new Date().toISOString(),
    rpId,
    userName,
  };

  localStorage.setItem(STORAGE_KEY_PASSKEY, JSON.stringify(passkeyData));
  return passkeyData;
}

/**
 * Authenticate and Sign with Biometrics using WebAuthn.
 * Invokes navigator.credentials.get() with userVerification: 'required'.
 * 
 * If no passkey has been registered yet, it will automatically register one first,
 * or authenticate against existing discoverable credentials.
 */
export async function authenticateWithBiometrics(
  challengeNonce: string,
  userAddress?: string
): Promise<WebAuthnAssertionResult> {
  if (typeof window === 'undefined' || !navigator.credentials || !navigator.credentials.get) {
    throw new Error('WebAuthn credentials.get is not supported in this browser.');
  }

  const rpId = window.location.hostname || 'localhost';

  // Format challenge bytes from challengeNonce string
  const enc = new TextEncoder();
  const challengeBytes = enc.encode(challengeNonce || `AWallet-${Date.now()}-${Math.random()}`);

  let savedPasskey = getSavedPasskey();

  // If no passkey is stored on this device, prompt registration first
  if (!savedPasskey) {
    try {
      savedPasskey = await registerBiometricPasskey(userAddress || 'anchor-user', 'AWallet Biometric Anchor');
    } catch (regErr: any) {
      // If registration failed due to user abort or policy, bubble up
      console.warn('[WebAuthn] Initial passkey auto-registration attempt:', regErr);
      throw regErr;
    }
  }

  const allowCredentials: PublicKeyCredentialDescriptor[] = savedPasskey
    ? [
        {
          id: base64UrlToBuffer(savedPasskey.credentialId),
          type: 'public-key',
          transports: ['internal'],
        },
      ]
    : [];

  const getOptions: PublicKeyCredentialRequestOptions = {
    challenge: challengeBytes,
    rpId,
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    userVerification: 'required', // Forces Touch ID, Face ID, Windows Hello biometric prompt
    timeout: 60000,
  };

  const assertion = (await navigator.credentials.get({
    publicKey: getOptions,
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error('Biometric authentication returned empty assertion.');
  }

  const response = assertion.response as AuthenticatorAssertionResponse;

  const rawIdBase64 = bufferToBase64Url(assertion.rawId);
  const clientDataJSON = new TextDecoder().decode(response.clientDataJSON);
  const authDataHex = bufferToHex(response.authenticatorData);
  const signatureHex = bufferToHex(response.signature);

  return {
    success: true,
    credentialId: rawIdBase64,
    clientDataJSON,
    authenticatorData: authDataHex,
    signatureHex: `0x${signatureHex}`,
    rpId,
    timestamp: new Date().toISOString(),
    biometricConfirmed: true,
    rawAssertion: assertion,
  };
}
