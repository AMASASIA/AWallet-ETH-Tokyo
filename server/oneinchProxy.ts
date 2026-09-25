import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { checkSwapPolicy, verifySecretVaultGrant } from './policyEngineAdapter.ts';
import { buildFusionOrderWithSdk, submitFusionOrderWithSdk } from './fusionBuilder.ts';

const { Router } = express;

// ----------------------------------------------------------------------------
// Constants & Security Configuration (Base Chain 8453)
// ----------------------------------------------------------------------------
export const BASE_CHAIN_ID = 8453;

// 1. 1inch Limit Order Protocol v4 & Aggregation Router v6 (ERC-20 token allowance spender on Base)
export const ONEINCH_LIMIT_ORDER_PROTOCOL_V4 = '0x111111125421cA6dc452d289314280a0f8842A65';

// 2. 1inch Fusion SimpleSettlement extension (Resolver Dutch Auction & Settlement contract on Base)
export const ONEINCH_FUSION_SIMPLE_SETTLEMENT = '0xA88800CDD53b47647900b9826a798D377d6baA84';

// 3. Canonical Permit2 Spender (EVM Universal)
export const ONEINCH_PERMIT2_SPENDER = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// Strictly whitelisted Spender addresses on Base
export const ONEINCH_WHITELISTED_SPENDERS: string[] = [
  ONEINCH_LIMIT_ORDER_PROTOCOL_V4,
  ONEINCH_FUSION_SIMPLE_SETTLEMENT,
  ONEINCH_PERMIT2_SPENDER,
];

// Default spender contract for 1inch Fusion Limit Orders
export const WHITELISTED_FUSION_SETTLEMENT = ONEINCH_LIMIT_ORDER_PROTOCOL_V4;

// Known Base token addresses
export const BASE_TOKEN_ADDRESSES: Record<string, string> = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  WETH: '0x4200000000000000000000000000000000000006',
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  CBBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  AERO: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
};

// ----------------------------------------------------------------------------
// Secret Vault Authentication & Ephemeral Token Verification Middleware
// ----------------------------------------------------------------------------
/**
 * Validates Secret Vault Ephemeral Token Grants as mandated by TIVE.md §4.2.
 * - In production: rejects unauthenticated requests with HTTP 401/403.
 * - In development: accepts test grant or logs explicit dev warning.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] || '';
  const vaultHeader = req.headers['x-secret-vault-grant'] as string;
  const token = vaultHeader || (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '');

  const isProduction = process.env.NODE_ENV === 'production';

  if (!token) {
    if (isProduction) {
      return res.status(401).json({
        error: 'AUTH_REQUIRED: Missing Secret Vault grant token in Authorization / x-secret-vault-grant header.',
        code: 'UNAUTHORIZED_NO_GRANT',
      });
    }
    // In dev environment, allow anchor header fallback with explicit tracking
    const anchorId = (req.headers['x-anchor-id'] as string) || 'dev-anchor-default';
    (req as any).anchorId = anchorId;
    (req as any).authMethod = 'dev_mock_anchor';
    return next();
  }

  const targetRecipient = (req.body?.spender || req.query?.spender || WHITELISTED_FUSION_SETTLEMENT) as string;
  const amountUsd = parseFloat((req.body?.amountUsd || req.query?.amountUsd || '0') as string) || 0;
  const expectedWallet = (req.body?.makerAddress || req.query?.walletAddress) as string | undefined;

  const verification = verifySecretVaultGrant(token, targetRecipient, amountUsd, expectedWallet);
  if (!verification.valid) {
    return res.status(403).json({
      error: `FORBIDDEN: Secret Vault validation failed: ${verification.reason}`,
      code: 'SECRET_VAULT_GRANT_INVALID',
    });
  }

  (req as any).anchorId = verification.grant?.grantId || 'vault-grant';
  (req as any).secretVaultGrant = verification.grant;
  (req as any).authMethod = 'secret_vault_grant_verified';
  next();
}

// ----------------------------------------------------------------------------
// Policy Engine Interface (Pluggable for seamless 1-line integration)
// ----------------------------------------------------------------------------
export interface ServerPolicyEvaluationResult {
  allowed: boolean;
  tier: 1 | 2 | 3 | 4;
  sessionKeyEligible: boolean;
  requiresGuardianApproval: boolean;
  circuitBreakerTriggered?: boolean;
  whyApprovalNeeded?: string;
  reason?: string;
}

export interface ServerPolicyEvaluator {
  evaluate(params: {
    walletAddress?: string;
    targetAddress: string;
    amountUsd: number;
  }): ServerPolicyEvaluationResult;
}

/**
 * Deterministic Default Policy Engine Evaluator for AWallet:
 * Delegates to checkSwapPolicy from policyEngineAdapter.ts
 */
export const defaultPolicyEvaluator: ServerPolicyEvaluator = {
  evaluate({ walletAddress, targetAddress, amountUsd }) {
    // Contract Whitelist check
    const isWhitelisted = ONEINCH_WHITELISTED_SPENDERS.some(
      (s) => s.toLowerCase() === targetAddress.toLowerCase()
    );
    if (!isWhitelisted) {
      return {
        allowed: false,
        tier: 4,
        sessionKeyEligible: false,
        requiresGuardianApproval: true,
        circuitBreakerTriggered: true,
        whyApprovalNeeded: 'Unauthorized target contract detected. Policy Engine Tier 4 Escalation.',
        reason: 'Contract address is not whitelisted for 1inch Fusion settlement.',
      };
    }

    return checkSwapPolicy({ walletAddress, targetAddress, amountUsd });
  },
};

// Configurable plug-in instance
let activePolicyEvaluator: ServerPolicyEvaluator = defaultPolicyEvaluator;

export function setPolicyEvaluator(evaluator: ServerPolicyEvaluator) {
  activePolicyEvaluator = evaluator;
}

// ----------------------------------------------------------------------------
// Rate Limiter & In-Memory TTL Cache (Protects 1inch API limits & DDoS)
// ----------------------------------------------------------------------------
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const quoteCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5 seconds quote caching

// Lightweight in-memory rate limiter per IP
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);
  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

// Input address validation regex
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Fallback pricing table for deterministic simulation when API key is not configured
const MOCK_TOKEN_PRICES: Record<string, number> = {
  USDC: 1.0,
  ETH: 3150.0,
  WETH: 3150.0,
  CBBTC: 68500.0,
  AERO: 0.42,
};

// ----------------------------------------------------------------------------
// Router Implementation
// ----------------------------------------------------------------------------
export const oneinchRouter = Router();

/**
 * GET /api/swap/quote
 * Proxies quote request to 1inch Fusion API v6.0 on Base (Chain 8453)
 * query params:
 *  - srcToken: address or symbol
 *  - dstToken: address or symbol
 *  - amount: float string
 *  - fromPriceUsd?: optional hint for USD calculation
 */
oneinchRouter.get('/quote', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a few seconds before requesting new quotes.' });
  }

  const { srcToken, dstToken, amount, walletAddress } = req.query;

  if (!srcToken || !dstToken || !amount) {
    return res.status(400).json({ error: 'Missing required parameters: srcToken, dstToken, amount' });
  }

  const parsedAmount = parseFloat(amount as string);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Resolve token addresses or normalize symbols
  const srcSymbol = (srcToken as string).toUpperCase();
  const dstSymbol = (dstToken as string).toUpperCase();
  const srcAddress = BASE_TOKEN_ADDRESSES[srcSymbol] || (isValidAddress(srcToken as string) ? srcToken : null);
  const dstAddress = BASE_TOKEN_ADDRESSES[dstSymbol] || (isValidAddress(dstToken as string) ? dstToken : null);

  const cacheKey = `${srcAddress || srcSymbol}-${dstAddress || dstSymbol}-${parsedAmount}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return res.json(cached.data);
  }

  const apiKey = process.env.ONEINCH_API_KEY?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  // SECURITY ENFORCEMENT:
  // In production, an absent API key must fail immediately (500) rather than serving simulated rates.
  if (isProduction && !apiKey) {
    return res.status(500).json({
      error: 'CRITICAL_CONFIG_ERROR: ONEINCH_API_KEY environment variable is required in production. Simulated rates are strictly prohibited in production mode.',
      code: 'MISSING_API_KEY_PRODUCTION',
    });
  }

  // If live 1inch API key is present, attempt live quote fetch
  if (apiKey && srcAddress && dstAddress) {
    try {
      // 1inch API format: amount in base units (e.g. 6 decimals for USDC, 18 for ETH)
      const decimals = srcSymbol === 'USDC' ? 6 : srcSymbol === 'CBBTC' ? 8 : 18;
      const rawAmountUnits = BigInt(Math.floor(parsedAmount * Math.pow(10, decimals))).toString();

      const url = `https://api.1inch.dev/swap/v6.0/${BASE_CHAIN_ID}/quote?src=${srcAddress}&dst=${dstAddress}&amount=${rawAmountUnits}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const liveData = (await response.json()) as any;
        const toDecimals = dstSymbol === 'USDC' ? 6 : dstSymbol === 'CBBTC' ? 8 : 18;
        const dstAmount = parseFloat(liveData.dstAmount || '0') / Math.pow(10, toDecimals);
        const slippage = 0.003; // 0.3% auction buffer
        const minToAmount = dstAmount * (1 - slippage);

        const result = {
          source: '1inch-fusion-live',
          apiKeyConfigured: true,
          simulated: false,
          chainId: BASE_CHAIN_ID,
          fromAmount: parsedAmount,
          toAmount: dstAmount,
          minToAmount,
          rate: parsedAmount > 0 ? dstAmount / parsedAmount : 0,
          estimatedGasFeeUsd: 0, // Resolvers pay gas in Fusion
          auctionDurationSec: 120,
          mevProtected: true,
          settlementAddress: WHITELISTED_FUSION_SETTLEMENT,
        };

        quoteCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return res.json(result);
      }
      const errText = await response.text();
      console.warn(`[1inch Proxy] Live API returned ${response.status}: ${errText}`);
      
      // In production, do NOT fall back to simulation if upstream API failed!
      if (isProduction) {
        return res.status(502).json({
          error: 'UPSTREAM_API_ERROR: Upstream 1inch API request failed in production environment.',
          details: errText,
          code: 'UPSTREAM_QUOTE_FAILED',
        });
      }
    } catch (err: any) {
      console.error('[1inch Proxy] Live fetch failed:', err);
      if (isProduction) {
        return res.status(502).json({
          error: 'UPSTREAM_NETWORK_ERROR: Failed to connect to 1inch API in production environment.',
          details: err?.message,
          code: 'UPSTREAM_FETCH_FAILED',
        });
      }
    }
  }

  // Fallback / Sandbox Quote calculation (ONLY permitted in development/test environment)
  const srcPrice = MOCK_TOKEN_PRICES[srcSymbol] || 1;
  const dstPrice = MOCK_TOKEN_PRICES[dstSymbol] || 1;
  const fromUsd = parsedAmount * srcPrice;
  const toAmount = dstPrice > 0 ? fromUsd / dstPrice : 0;
  const slippage = 0.003;
  const minToAmount = toAmount * (1 - slippage);

  const fallbackResult = {
    source: apiKey ? '1inch-fusion-live-fallback' : '1inch-fusion-sandbox',
    apiKeyConfigured: Boolean(apiKey),
    simulated: true, // Explicitly tagged as simulated rate
    chainId: BASE_CHAIN_ID,
    fromAmount: parsedAmount,
    toAmount,
    minToAmount,
    rate: parsedAmount > 0 ? toAmount / parsedAmount : 0,
    estimatedGasFeeUsd: 0,
    auctionDurationSec: 120,
    mevProtected: true,
    settlementAddress: WHITELISTED_FUSION_SETTLEMENT,
  };

  quoteCache.set(cacheKey, { data: fallbackResult, expiresAt: Date.now() + CACHE_TTL_MS });
  return res.json(fallbackResult);
});

/**
 * GET /api/swap/allowance
 * Verifies ERC-20 allowance towards 1inch Fusion settlement contract
 * and simultaneously evaluates Policy Engine Tier restrictions
 */
oneinchRouter.get('/allowance', requireAuth, async (req: Request, res: Response) => {
  const { tokenAddress, walletAddress, amountUsd } = req.query;

  if (!tokenAddress || !walletAddress) {
    return res.status(400).json({ error: 'Missing required parameters: tokenAddress, walletAddress' });
  }

  const token = (tokenAddress as string).trim();
  const wallet = (walletAddress as string).trim();
  const usdVal = parseFloat(amountUsd as string) || 0;

  if (!isValidAddress(token) && !BASE_TOKEN_ADDRESSES[token.toUpperCase()]) {
    return res.status(400).json({ error: 'Invalid token address or symbol' });
  }
  if (!isValidAddress(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const apiKey = process.env.ONEINCH_API_KEY?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  // SECURITY ENFORCEMENT:
  // In production, an absent API key must fail immediately (500) rather than assuming MaxUint256
  if (isProduction && !apiKey) {
    return res.status(500).json({
      error: 'CRITICAL_CONFIG_ERROR: ONEINCH_API_KEY environment variable is required in production for live allowance verification.',
      code: 'MISSING_API_KEY_PRODUCTION',
    });
  }

  // Run Policy Engine Evaluation simultaneously
  const policyResult = activePolicyEvaluator.evaluate({
    walletAddress: wallet,
    targetAddress: WHITELISTED_FUSION_SETTLEMENT,
    amountUsd: usdVal,
  });

  let currentAllowance = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // Max uint256 dev default

  if (apiKey && isValidAddress(token)) {
    try {
      const url = `https://api.1inch.dev/swap/v6.0/${BASE_CHAIN_ID}/approve/allowance?tokenAddress=${token}&walletAddress=${wallet}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      });
      if (response.ok) {
        const data = (await response.json()) as any;
        currentAllowance = data.allowance || '0';
      }
    } catch (e) {
      console.warn('[1inch Proxy] Error fetching allowance from 1inch, returning safe check:', e);
    }
  }

  return res.json({
    spender: WHITELISTED_FUSION_SETTLEMENT,
    isSpenderWhitelisted: true,
    allowance: currentAllowance,
    hasSufficientAllowance: currentAllowance !== '0',
    simulated: !apiKey,
    policy: policyResult,
  });
});

/**
 * POST /api/swap/build-order
 * Generates EIP-712 structured Fusion Order data using official @1inch/fusion-sdk
 * with strict settlement whitelisting and Policy Engine deterministic check
 */
oneinchRouter.post('/build-order', requireAuth, async (req: Request, res: Response) => {
  const {
    makerAddress,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    spender,
    auctionDurationSec,
  } = req.body;

  if (!makerAddress || !fromToken || !toToken || !fromAmount || !toAmount) {
    return res.status(400).json({ error: 'Incomplete order parameters' });
  }

  try {
    const result = await buildFusionOrderWithSdk({
      makerAddress,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      spender,
      auctionDurationSec,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[1inch Proxy] buildFusionOrderWithSdk error:', err);
    const message = err?.message || 'Failed to build FusionOrder';
    const isSecurityError = message.includes('SECURITY_VIOLATION') || message.includes('POLICY_ENGINE_REJECTED');
    return res.status(isSecurityError ? 403 : 400).json({
      error: message,
      code: isSecurityError ? 'FORBIDDEN_POLICY_VIOLATION' : 'ORDER_BUILD_ERROR',
    });
  }
});

/**
 * POST /api/swap/submit-order
 * Submits a signed FusionOrder (Passkey or EIP-712 signature) to 1inch Fusion Relayer
 */
oneinchRouter.post('/submit-order', requireAuth, async (req: Request, res: Response) => {
  const { order, signature, quoteId, orderHash } = req.body;

  if (!order || !signature) {
    return res.status(400).json({
      error: 'Missing required parameters: order and signature are required to submit order to Relayer',
    });
  }

  try {
    const result = await submitFusionOrderWithSdk({
      order,
      signature,
      quoteId,
      orderHash,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('[1inch Proxy] submitFusionOrderWithSdk error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to submit FusionOrder to Relayer',
      code: 'ORDER_SUBMISSION_FAILED',
    });
  }
});

