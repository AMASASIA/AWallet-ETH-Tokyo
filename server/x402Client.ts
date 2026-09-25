/**
 * x402 Protocol Client (HTTP 402 Payment Required)
 * Implements machine-to-machine micropayment paywalls for AI Agent resources and M2M settling.
 */

export interface X402PaymentRequirement {
  status: 402;
  scheme: 'exact';
  network: 'base-sepolia' | 'base';
  chainId: number;
  token: 'USDC';
  tokenAddress: string;
  amount: string;
  amountUsdc: number;
  recipient: string;
  resourceId: string;
  description: string;
  ttlSeconds: number;
}

export interface X402PaymentProof {
  txHash: string;
  sender: string;
  resourceId: string;
}

export interface X402Receipt {
  accessGranted: boolean;
  resourceId: string;
  accessToken: string;
  expiresAt: string;
  settledTx: string;
}

export class X402Client {
  public static readonly USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  public static readonly DEFAULT_RECIPIENT = '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01';

  public static createRequirement(
    resourceId: string,
    amountUsdc = 0.05,
    description = 'Autonomous AI Agent Market Data Inference'
  ): X402PaymentRequirement {
    return {
      status: 402,
      scheme: 'exact',
      network: 'base-sepolia',
      chainId: 84532,
      token: 'USDC',
      tokenAddress: this.USDC_BASE_SEPOLIA,
      amount: (amountUsdc * 1e6).toFixed(0), // 6 decimals for USDC
      amountUsdc,
      recipient: this.DEFAULT_RECIPIENT,
      resourceId,
      description,
      ttlSeconds: 300,
    };
  }

  public static verifyProof(proof: X402PaymentProof): X402Receipt {
    const isMockOrValid = proof.txHash && proof.txHash.startsWith('0x');
    if (!isMockOrValid) {
      throw new Error('Invalid x402 payment proof txHash');
    }

    return {
      accessGranted: true,
      resourceId: proof.resourceId,
      accessToken: `x402_grant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour access
      settledTx: proof.txHash,
    };
  }
}
