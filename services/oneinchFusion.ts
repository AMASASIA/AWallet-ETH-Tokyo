import { Token, FusionQuote, FusionOrder } from '../types';

// Base Mainnet Chain ID for 1inch Fusion
export const BASE_CHAIN_ID = 8453;

// 1. ERC-20 Token Allowance Spender on Base (1inch Limit Order Protocol v4 / Aggregation Router v6)
export const BASE_1INCH_LOP_V4_SPENDER = '0x111111125421cA6dc452d289314280a0f8842A65';

// 2. 1inch Fusion SimpleSettlement Extension on Base (Dutch Auction & Settlement Resolver contract)
export const BASE_FUSION_SIMPLE_SETTLEMENT = '0xA88800CDD53b47647900b9826a798D377d6baA84';

// 3. Permit2 Universal Spender
export const PERMIT2_SPENDER = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// Default ERC-20 Allowance Spender
export const BASE_FUSION_SETTLEMENT_ADDRESS = BASE_1INCH_LOP_V4_SPENDER;

/**
 * Calculates a gasless 1inch Fusion swap quote on Base.
 * Returns synchronous estimate for immediate UI responsiveness.
 */
export function getFusionQuote(
  fromToken: Token,
  toToken: Token,
  fromAmount: number
): FusionQuote {
  const fromPrice = fromToken.priceUsd || (fromToken.symbol === 'ETH' ? 3120 : fromToken.symbol === 'cbBTC' ? 68000 : fromToken.symbol === 'AERO' ? 0.4 : 1);
  const toPrice = toToken.priceUsd || (toToken.symbol === 'ETH' ? 3120 : toToken.symbol === 'cbBTC' ? 68000 : toToken.symbol === 'AERO' ? 0.4 : 1);

  const fromUsd = fromAmount * fromPrice;
  const toAmount = toPrice > 0 ? fromUsd / toPrice : 0;
  const slippage = 0.003; // 0.3% auction buffer
  const minToAmount = toAmount * (1 - slippage);
  const rate = fromAmount > 0 ? toAmount / fromAmount : 0;

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    estimatedGasFeeUsd: 0, // Resolvers pay gas in 1inch Fusion
    auctionDurationSec: 120,
    minToAmount,
    rate,
    mevProtected: true,
    simulated: true, // Explicitly tagged as local simulation
    source: 'local-estimate',
  };
}

/**
 * Asynchronously fetches a live quote via the Express /api/swap/quote proxy
 * which protects the 1inch API key and manages server-side rate limits & caches.
 */
export async function fetchFusionQuoteAsync(
  fromToken: Token,
  toToken: Token,
  fromAmount: number,
  walletAddress?: string
): Promise<FusionQuote> {
  if (fromAmount <= 0) {
    return getFusionQuote(fromToken, toToken, fromAmount);
  }

  try {
    const params = new URLSearchParams({
      srcToken: fromToken.address || fromToken.symbol,
      dstToken: toToken.address || toToken.symbol,
      amount: fromAmount.toString(),
    });
    if (walletAddress) params.append('walletAddress', walletAddress);

    const res = await fetch(`/api/swap/quote?${params.toString()}`);
    if (!res.ok) {
      console.warn(`[/api/swap/quote] Status ${res.status}, using local estimate.`);
      return getFusionQuote(fromToken, toToken, fromAmount);
    }
    const data = await res.json();
    return {
      fromToken,
      toToken,
      fromAmount: data.fromAmount ?? fromAmount,
      toAmount: data.toAmount,
      estimatedGasFeeUsd: 0,
      auctionDurationSec: data.auctionDurationSec ?? 120,
      minToAmount: data.minToAmount,
      rate: data.rate,
      mevProtected: true,
      simulated: Boolean(data.simulated),
      source: data.source,
    };
  } catch (err) {
    console.warn('Failed to fetch from proxy quote endpoint, fallback to estimate:', err);
    return getFusionQuote(fromToken, toToken, fromAmount);
  }
}

/**
 * Verifies token allowance to 1inch Fusion settlement contract
 * and returns Policy Engine evaluation.
 */
export async function checkFusionAllowance(
  tokenAddress: string,
  walletAddress: string,
  amountUsd: number
): Promise<{
  hasSufficientAllowance: boolean;
  spender: string;
  simulated?: boolean;
  policy: {
    allowed: boolean;
    tier: number;
    whyApprovalNeeded?: string;
  };
}> {
  try {
    const params = new URLSearchParams({
      tokenAddress,
      walletAddress,
      amountUsd: amountUsd.toString(),
    });
    const res = await fetch(`/api/swap/allowance?${params.toString()}`);
    if (res.ok) {
      return await res.json();
    }
    const errJson = await res.json().catch(() => null);
    if (res.status === 401 || res.status === 403 || res.status === 500) {
      return {
        hasSufficientAllowance: false,
        spender: BASE_FUSION_SETTLEMENT_ADDRESS,
        simulated: true,
        policy: {
          allowed: false,
          tier: 4,
          whyApprovalNeeded: errJson?.error || `Allowance check rejected with HTTP ${res.status}`,
        },
      };
    }
  } catch (err) {
    console.warn('Failed to check allowance via proxy:', err);
  }

  return {
    hasSufficientAllowance: true,
    spender: BASE_FUSION_SETTLEMENT_ADDRESS,
    simulated: true,
    policy: {
      allowed: amountUsd <= 1000,
      tier: amountUsd > 1000 ? 4 : amountUsd > 10 ? 3 : amountUsd > 5 ? 2 : 1,
      whyApprovalNeeded:
        amountUsd > 1000
          ? 'Transaction exceeds $1,000 USD limit. Circuit Breaker activated.'
          : amountUsd > 10
          ? 'Transaction exceeds $10.00 USD. Biometric Passkey required.'
          : amountUsd > 5
          ? 'Physical Pico W tap confirmation.'
          : 'Autonomous micro-execution (< $5.00 USD).',
    },
  };
}

/**
 * Submits an order through the Express proxy /api/swap/build-order
 * Validates the whitelisted spender contract and requests Base typed signature.
 * Strictly throws if the server or policy engine rejects the transaction.
 */
export async function submitFusionOrder(
  quote: FusionQuote,
  makerAddress: string
): Promise<FusionOrder> {
  let res: Response;
  try {
    res = await fetch('/api/swap/build-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        makerAddress,
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        spender: BASE_FUSION_SETTLEMENT_ADDRESS,
      }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error reaching Swap Gateway';
    console.error('Proxy build-order network connection error:', err);
    throw new Error(`Swap Gateway connection failed: ${message}`);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const errorMessage =
      errorData?.error ||
      errorData?.details?.whyApprovalNeeded ||
      errorData?.message ||
      `Swap order rejected (HTTP ${res.status}: ${res.statusText})`;
    console.error('[submitFusionOrder] Order rejected by security gateway:', errorMessage, errorData);
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return {
    orderHash: data.orderHash,
    status: 'settled',
    fromTokenSymbol: quote.fromToken.symbol,
    toTokenSymbol: quote.toToken.symbol,
    fromAmount: quote.fromAmount,
    toAmount: quote.toAmount,
    createdAt: new Date().toISOString(),
  };
}
