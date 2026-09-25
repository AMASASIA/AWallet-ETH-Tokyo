import { PolicyEngineConfig, PolicyEvaluationResult, SessionKey } from '../types';

export const INITIAL_POLICY_CONFIG: PolicyEngineConfig = {
  dailySpendCapUsd: 500,
  dailySpentUsd: 120, // 120 USD already spent today
  singleTxLimitUsd: 250,
  circuitBreakerStatus: 'NORMAL',
  whitelistOnly: false,
  whitelistedContracts: [
    '0x111111125421cA6dc452d289314280a0f8842A65', // 1inch Fusion Settlement on Base
    '0x4200000000000000000000000000000000000006', // WETH Base
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC Base
  ],
  sessionKeys: [
    {
      id: 'sk-1',
      publicKey: '0x3a99...F01b',
      label: '1inch Fusion Auto-Settler',
      validUntil: Date.now() + 86400000 * 7, // 7 days
      singleTxLimitUsd: 100,
      allowedTargets: ['0x111111125421cA6dc452d289314280a0f8842A65'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      active: true,
    },
    {
      id: 'sk-2',
      publicKey: '0x9c21...84Ae',
      label: 'DApp Micro-transactions (Tier 2)',
      validUntil: Date.now() + 86400000 * 30, // 30 days
      singleTxLimitUsd: 50,
      allowedTargets: ['*'],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      active: true,
    }
  ]
};

/**
 * Evaluates a proposed transaction against the SessionKeyModule & Circuit Breaker Policy.
 * - If Circuit Breaker is TRIPPED: All automated & normal actions blocked.
 * - If singleTxLimit or dailySpendCap exceeded: Requires Guardian / Safe Multisig manual signing.
 * - If within session key permissions: SessionKey auto-approves (0-click / passkey-bypassed).
 */
export function evaluateTransactionPolicy(
  amountUsd: number,
  targetAddress: string,
  config: PolicyEngineConfig
): PolicyEvaluationResult {
  // 1. Circuit Breaker Check
  if (config.circuitBreakerStatus === 'TRIPPED') {
    return {
      allowed: false,
      sessionKeyEligible: false,
      circuitBreakerTriggered: true,
      requiresGuardianApproval: true,
      reason: `CIRCUIT BREAKER IS TRIPPED: ${config.circuitBreakerReason || 'Emergency pause triggered'}`,
    };
  }

  // 1.5 Whitelist-Only Enforcement
  if (config.whitelistOnly) {
    const normalizedTarget = targetAddress.toLowerCase();
    const isWhitelisted = config.whitelistedContracts.some(
      (addr) => addr.toLowerCase() === normalizedTarget
    );
    if (!isWhitelisted) {
      return {
        allowed: false,
        sessionKeyEligible: false,
        requiresGuardianApproval: true,
        circuitBreakerTriggered: false,
        reason: `Target (${targetAddress}) is not in approved whitelist. Whitelist-Only mode is enforced.`,
      };
    }
  }

  // 2. Anomaly detection: Sudden extreme value (> $5,000 in single action triggers Circuit Breaker)
  if (amountUsd > 5000) {
    return {
      allowed: false,
      sessionKeyEligible: false,
      circuitBreakerTriggered: true,
      requiresGuardianApproval: true,
      reason: 'Anomaly detected: Transaction exceeded panic threshold ($5,000 USD). Circuit Breaker activated.',
    };
  }

  // 3. Daily Cap Check
  const projectedDailySpent = config.dailySpentUsd + amountUsd;
  if (projectedDailySpent > config.dailySpendCapUsd) {
    return {
      allowed: true,
      sessionKeyEligible: false,
      requiresGuardianApproval: true,
      reason: `Daily spend cap exceeded (${projectedDailySpent.toFixed(2)} / ${config.dailySpendCapUsd} USD). Guardian confirmation required.`,
    };
  }

  // 4. Single Tx Limit Check
  if (amountUsd > config.singleTxLimitUsd) {
    return {
      allowed: true,
      sessionKeyEligible: false,
      requiresGuardianApproval: true,
      reason: `Exceeds single transaction session limit ($${config.singleTxLimitUsd} USD). Manual passkey approval required.`,
    };
  }

  // 5. Check if any active Session Key covers this target
  const eligibleSession = config.sessionKeys.find(
    (sk) =>
      sk.active &&
      sk.validUntil > Date.now() &&
      amountUsd <= sk.singleTxLimitUsd &&
      (sk.allowedTargets.includes('*') ||
        sk.allowedTargets.some((t) => t.toLowerCase() === targetAddress.toLowerCase()))
  );

  if (eligibleSession) {
    return {
      allowed: true,
      sessionKeyEligible: true,
      requiresGuardianApproval: false,
      reason: `Auto-approved by Session Key [${eligibleSession.label}] (${amountUsd.toFixed(2)} <= $${eligibleSession.singleTxLimitUsd} cap)`,
    };
  }

  // Normal passkey transaction allowed within policy
  return {
    allowed: true,
    sessionKeyEligible: false,
    requiresGuardianApproval: false,
  };
}

export function createNewSessionKey(
  label: string,
  singleTxLimitUsd: number,
  durationDays: number,
  target: string = '*'
): SessionKey {
  const randHex = Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return {
    id: `sk-${Date.now()}`,
    publicKey: `0x${randHex}...${Math.floor(1000 + Math.random() * 9000)}`,
    label: label || 'Custom Session Key',
    validUntil: Date.now() + durationDays * 86400000,
    singleTxLimitUsd,
    allowedTargets: target.trim() === '' ? ['*'] : [target.trim()],
    createdAt: new Date().toISOString(),
    active: true,
  };
}
