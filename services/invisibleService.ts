/**
 * Invisible Finance Client Service
 * Interacts with AWalletSessionKeyManager, DIDStreamingGaslessPaymaster, and Uniswap v4 DID Hook
 */

export interface StreamingSessionData {
  sessionId: string;
  account: string;
  agentAddress: string;
  recipientAddress: string;
  recipientDid: string;
  tokenAddress: string;
  maxPerStreamUsdc: number;
  totalCapUsdc: number;
  spentUsdc: number;
  intervalSeconds: number;
  lastExecutedAt: number;
  expiresAt: number;
  active: boolean;
  registeredTxHash: string;
  createdAt: string;
}

export interface InvisibleStatusResponse {
  success: boolean;
  network: string;
  chainId: number;
  contracts: {
    sessionKeyManager: string;
    gaslessPaymaster: string;
    didValidationHook: string;
    entryPointV07: string;
    usdcBaseSepolia: string;
  };
  activeSessionsCount: number;
  sessions: StreamingSessionData[];
  gaslessPaymaster: {
    address: string;
    entryPoint: string;
    strictSessionCheck: boolean;
    sponsoredTransactionsTotal: number;
  };
  didValidationHook: {
    address: string;
    hookType: string;
    eip1153TransientStorage: boolean;
    standard: string;
  };
}

export interface DIDSignedAttestation {
  attestor: string;
  userAddress: string;
  userDid: string;
  isCompliant: boolean;
  maxSwapAmountUsdc: number;
  deadline: number;
  nonce: string;
  signature: string;
  eip712Domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
}

export async function fetchInvisibleStatus(): Promise<InvisibleStatusResponse> {
  const res = await fetch('/api/invisible/status');
  if (!res.ok) throw new Error('Failed to fetch Invisible Finance status');
  return res.json();
}

export async function registerStreamingSession(params: {
  account: string;
  recipientAddress: string;
  recipientDid?: string;
  maxPerStreamUsdc: number;
  totalCapUsdc?: number;
  intervalSeconds?: number;
  agentAddress?: string;
}): Promise<{ success: boolean; message: string; session: StreamingSessionData; txHash: string }> {
  const res = await fetch('/api/invisible/session/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Failed to register session');
  }
  return res.json();
}

export async function revokeStreamingSession(sessionId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/invisible/session/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Revocation failed' }));
    throw new Error(err.error || 'Failed to revoke session');
  }
  return res.json();
}

export async function executeAgentStreamingPayment(params: {
  sessionId: string;
  amountUsdc?: number;
}): Promise<{
  success: boolean;
  message: string;
  receipt: {
    sessionId: string;
    amountUsdc: number;
    userOpHash: string;
    txHash: string;
    blockNumber: number;
    paymaster: string;
    recipient: string;
    gasSponsored: boolean;
    remainingCapUsdc: number;
  };
  updatedSession: StreamingSessionData;
}> {
  const res = await fetch('/api/invisible/agent/execute-streaming', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Execution failed' }));
    throw new Error(err.error || 'Failed to execute streaming payment');
  }
  return res.json();
}

export async function requestDIDAttestation(params: {
  userAddress: string;
  userDid?: string;
  maxSwapAmountUsdc?: number;
}): Promise<{ success: boolean; attestation: DIDSignedAttestation }> {
  const res = await fetch('/api/invisible/did/sign-attestation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Attestation failed' }));
    throw new Error(err.error || 'Failed to sign DID attestation');
  }
  return res.json();
}
