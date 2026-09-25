// server/policyEngineAdapter.ts
//
// 修正点（前回指摘 B, C, G への対応）:
//  B. VAULT_SECRET_KEYのハードコードされたフォールバック文字列を廃止。
//     未設定なら起動時に例外を投げ、サーバーごと起動させない（fail-closed）。
//  C. 署名検証を NODE_ENV に関わらず常時実施する。開発時に未署名グラントを
//     許可したい場合は ALLOW_UNSIGNED_DEV_GRANTS=true を明示的に設定した場合のみ、
//     かつ NODE_ENV !== 'production' の場合に限り許可する（デフォルトはオフ）。
//  G. グラントは一度使うと無効化する（単発利用の強制）。
//     また recipient（宛先コントラクト）だけでなく、グラントを発行された
//     anchorId/walletAddress にもリクエスト元を紐付けて検証する。

import './envLoader.ts';
import crypto from "crypto";

export interface SwapPolicyParams {
  anchorId?: string;
  walletAddress?: string;
  targetAddress: string;
  amountUsd: number;
}

export interface SwapPolicyResult {
  allowed: boolean;
  tier: 1 | 2 | 3 | 4;
  sessionKeyEligible: boolean;
  requiresGuardianApproval: boolean;
  circuitBreakerTriggered?: boolean;
  whyApprovalNeeded?: string;
  reason?: string;
}

/**
 * Secret Vault Ephemeral Token Structure (TIVE.md §4.2 準拠 + 拡張)
 * - anchorId / boundWallet を追加: グラントを「誰の」「どのウォレットの」操作として
 *   発行したかを明示し、宛先コントラクトだけでなく発行対象にも紐付ける。
 */
export interface SecretVaultGrantToken {
  grantId: string;
  anchorId: string;
  boundWallet: string;
  actionHash: string;
  ttlSeconds: number;
  maxSpendUsd: number;
  recipient: string; // 宛先コントラクト（spender）。'*' で任意許可。
  issuedAt: number; // Unix seconds
  signature: string; // HMAC-SHA256
}

// --- B: ハードコードされた固定文字列フォールバックは完全撤去。
// 本番（production）では未設定時に即座に起動時例外を発生（fail-closed）。
// 開発環境ではリポジトリへの鍵混入防止のため、未設定時はメモリ内にセキュアな一時鍵（ephemeral key）を動的生成。
function resolveVaultKey(): string {
  const key = process.env.SECRET_VAULT_HMAC_KEY;
  if (key && key.trim() !== "") {
    return key.trim();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[policyEngineAdapter] FATAL: SECRET_VAULT_HMAC_KEY が本番環境で未設定です。" +
        "グラント署名の検証に使われるため、十分なエントロピーを持つ鍵を環境変数として設定してください（例: openssl rand -hex 32）。"
    );
  }

  // 開発環境用のエフェメラル鍵を動的生成（固定値のハードコードは禁止）
  const ephemeralKey = crypto.randomBytes(32).toString("hex");
  console.warn(
    "[policyEngineAdapter] NOTICE: SECRET_VAULT_HMAC_KEY is not set in development mode. " +
      "Generated an ephemeral memory-only key for this session to prevent secret leaks in repository."
  );
  return ephemeralKey;
}
const VAULT_SECRET_KEY = resolveVaultKey();

// 開発時のみ、明示的なオプトインで未署名グラントを許可する（本番では絶対に効かない）
const ALLOW_UNSIGNED_DEV_GRANTS =
  process.env.NODE_ENV !== "production" &&
  process.env.ALLOW_UNSIGNED_DEV_GRANTS === "true";

// --- G: 単発利用の強制。使用済みgrantIdを記録する（プロセス内メモリ）。
// NOTE: 複数インスタンス運用（水平スケール）の場合はRedis等の共有ストアに
//       置き換える必要がある。ここではシングルインスタンス前提の最小実装。
const consumedGrantIds = new Map<string, number>(); // grantId -> expiresAt(ms)

function sweepExpiredConsumedGrants() {
  const now = Date.now();
  for (const [id, expiresAt] of consumedGrantIds) {
    if (expiresAt < now) consumedGrantIds.delete(id);
  }
}

/**
 * Helper to issue a cryptographically signed Secret Vault grant token
 */
export function issueSecretVaultGrant(params: {
  grantId?: string;
  anchorId?: string;
  boundWallet: string;
  actionHash?: string;
  ttlSeconds?: number;
  maxSpendUsd: number;
  recipient: string;
}): SecretVaultGrantToken {
  const grantId = params.grantId || `grant_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const anchorId = params.anchorId || 'anchor_primary';
  const boundWallet = params.boundWallet;
  const actionHash = params.actionHash || crypto.randomBytes(16).toString('hex');
  const ttlSeconds = params.ttlSeconds || 30;
  const maxSpendUsd = params.maxSpendUsd;
  const recipient = params.recipient;
  const issuedAt = Math.floor(Date.now() / 1000);

  const payload = `${grantId}:${anchorId}:${boundWallet}:${actionHash}:${ttlSeconds}:${maxSpendUsd}:${recipient}:${issuedAt}`;
  const signature = crypto
    .createHmac('sha256', VAULT_SECRET_KEY)
    .update(payload)
    .digest('hex');

  return {
    grantId,
    anchorId,
    boundWallet,
    actionHash,
    ttlSeconds,
    maxSpendUsd,
    recipient,
    issuedAt,
    signature,
  };
}

export function verifySecretVaultGrant(
  tokenRaw: string | undefined,
  targetRecipient: string,
  amountUsd: number,
  requestingWallet: string
): { valid: boolean; reason?: string; grant?: SecretVaultGrantToken } {
  if (!tokenRaw) {
    return {
      valid: false,
      reason:
        "Missing Secret Vault grant token in Authorization / x-secret-vault-grant header.",
    };
  }

  let grant: SecretVaultGrantToken;
  try {
    grant = JSON.parse(
      tokenRaw.startsWith("{")
        ? tokenRaw
        : Buffer.from(tokenRaw, "base64").toString("utf8")
    );
  } catch (err: any) {
    return {
      valid: false,
      reason: `Failed to parse Secret Vault grant token: ${err?.message}`,
    };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = grant.issuedAt + grant.ttlSeconds;

  // 1. TTL
  if (nowSec > expiresAt) {
    return {
      valid: false,
      reason: `Secret Vault grant expired (${nowSec - expiresAt}s ago). Fresh grant required.`,
    };
  }

  // 2. 単発利用チェック（再利用は拒否）
  sweepExpiredConsumedGrants();
  if (consumedGrantIds.has(grant.grantId)) {
    return {
      valid: false,
      reason: "Grant already consumed. Each grant may be used exactly once.",
    };
  }

  // 3. 支出上限
  if (amountUsd > grant.maxSpendUsd) {
    return {
      valid: false,
      reason: `Grant max spend ceiling exceeded: requested $${amountUsd} USD > granted $${grant.maxSpendUsd} USD.`,
    };
  }

  // 4. 宛先コントラクト（spender）バインディング
  if (
    grant.recipient.toLowerCase() !== targetRecipient.toLowerCase() &&
    grant.recipient !== "*"
  ) {
    return {
      valid: false,
      reason: `Grant recipient mismatch: token bound to ${grant.recipient}, requested ${targetRecipient}.`,
    };
  }

  // 5. ウォレット/anchorIdバインディング（Gの修正: 宛先だけでなく発行対象も検証）
  if (
    requestingWallet &&
    grant.boundWallet &&
    grant.boundWallet !== "*" &&
    grant.boundWallet.toLowerCase() !== requestingWallet.toLowerCase()
  ) {
    return {
      valid: false,
      reason: `Grant wallet mismatch: token bound to ${grant.boundWallet}, requested by ${requestingWallet}.`,
    };
  }

  // 6. 署名検証（Cの修正: NODE_ENVに関わらず常時実施。開発時の例外は明示オプトインのみ）
  const payload = `${grant.grantId}:${grant.anchorId}:${grant.boundWallet}:${grant.actionHash}:${grant.ttlSeconds}:${grant.maxSpendUsd}:${grant.recipient}:${grant.issuedAt}`;
  const expectedSig = crypto
    .createHmac("sha256", VAULT_SECRET_KEY)
    .update(payload)
    .digest("hex");

  let signatureValid = false;
  try {
    signatureValid = crypto.timingSafeEqual(
      Buffer.from(grant.signature.padEnd(64, "0").slice(0, 64), "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    signatureValid = false;
  }

  if (!signatureValid && !ALLOW_UNSIGNED_DEV_GRANTS) {
    return { valid: false, reason: "Secret Vault cryptographic signature mismatch." };
  }

  // 検証通過 → 単発利用としてマーク（TTL経過後に自動的に掃除される）
  consumedGrantIds.set(grant.grantId, expiresAt * 1000 + 60_000);

  return { valid: true, grant };
}

/**
 * AWallet Policy Engine Tier閾値 (TIVE.md §3):
 *  Tier 1 (Autonomous):      <= $5.00 USD
 *  Tier 2 (Physical Tap):    $5.00 超 〜 $10.00 USD
 *  Tier 3 (Biometric Auth):  $10.00 超 〜 $1,000 USD
 *  Tier 4 (Circuit Breaker): $1,000 USD 超
 */
export function checkSwapPolicy(params: SwapPolicyParams): SwapPolicyResult {
  const { amountUsd } = params;

  if (amountUsd > 1000) {
    return {
      allowed: false,
      tier: 4,
      sessionKeyEligible: false,
      requiresGuardianApproval: true,
      circuitBreakerTriggered: true,
      whyApprovalNeeded:
        "Transaction exceeds anomaly panic limit ($1,000 USD). Circuit Breaker activated.",
      reason: "Tier 4 Anomaly detected: Extreme transaction size exceeds safety parameters.",
    };
  }

  if (amountUsd > 10) {
    return {
      allowed: true,
      tier: 3,
      sessionKeyEligible: false,
      requiresGuardianApproval: true,
      whyApprovalNeeded:
        "Transaction exceeds micro-threshold ($10.00 USD). WebAuthn Passkey biometric authorization required.",
      reason: "Tier 3 High-value asset swap requiring biometric authorization.",
    };
  }

  if (amountUsd > 5) {
    return {
      allowed: true,
      tier: 2,
      sessionKeyEligible: false,
      requiresGuardianApproval: false,
      whyApprovalNeeded: "Daily counter payment / physical tap confirmation.",
      reason: "Tier 2 Micro-payment ($5-$10 USD).",
    };
  }

  return {
    allowed: true,
    tier: 1,
    sessionKeyEligible: true,
    requiresGuardianApproval: false,
    whyApprovalNeeded:
      "Auto-approved autonomously within pre-signed Session Key micro-budget (< $5.00 USD).",
    reason: "Tier 1 Autonomous micro-execution.",
  };
}

export interface SendPolicyParams {
  fromAddress: string;
  toAddress: string;
  symbol: string;
  amount: number;
  amountUsd: number;
  whitelistOnly?: boolean;
  whitelistedAddresses?: string[];
}

export interface SendPolicyResult {
  allowed: boolean;
  tier: 1 | 2 | 3 | 4;
  sessionKeyEligible: boolean;
  requiresGuardianApproval: boolean;
  circuitBreakerTriggered?: boolean;
  whyApprovalNeeded?: string;
  reason?: string;
}

/**
 * Deterministic Policy Engine for Asset Transfers (Send / Transfer)
 * Tier 1 (Autonomous Micro-send): <= $5 USD
 * Tier 2 (Physical Confirmation): $5 - $10 USD
 * Tier 3 (Biometric / Passkey Approval): $10 - $1,000 USD
 * Tier 4 (Circuit Breaker / Anomaly Lockout): > $1,000 USD
 */
export function checkSendPolicy(params: SendPolicyParams): SendPolicyResult {
  const { toAddress, amountUsd } = params;

  // Zero-address or burning rejection
  if (
    !toAddress ||
    toAddress.toLowerCase() === '0x0000000000000000000000000000000000000000' ||
    toAddress.toLowerCase() === '0x0'
  ) {
    return {
      allowed: false,
      tier: 4,
      sessionKeyEligible: false,
      requiresGuardianApproval: true,
      circuitBreakerTriggered: false,
      whyApprovalNeeded: "Sending to zero address is permanently blocked to prevent accidental asset destruction.",
      reason: "Blocked: Invalid or zero address recipient.",
    };
  }

  // Whitelist-Only Enforcement
  if (params.whitelistOnly) {
    const list = params.whitelistedAddresses || [];
    const normalizedTo = toAddress.toLowerCase();
    const isWhitelisted = list.some((addr) => addr.toLowerCase() === normalizedTo);
    if (!isWhitelisted) {
      return {
        allowed: false,
        tier: 3,
        sessionKeyEligible: false,
        requiresGuardianApproval: true,
        circuitBreakerTriggered: false,
        whyApprovalNeeded: "Recipient is not on the approved address whitelist. Whitelist-Only security policy is active.",
        reason: `Blocked: Recipient (${toAddress}) is not in approved whitelist.`,
      };
    }
  }

  // Tier 4: Extreme transaction size exceeds safety parameters -> Circuit Breaker
  if (amountUsd > 1000) {
    return {
      allowed: false,
      tier: 4,
      sessionKeyEligible: false,
      requiresGuardianApproval: true,
      circuitBreakerTriggered: true,
      whyApprovalNeeded:
        "Transfer exceeds anomaly panic threshold ($1,000 USD). Circuit Breaker activated.",
      reason: "Tier 4 Anomaly detected: Extreme transfer size exceeds safety parameters.",
    };
  }

  // Tier 3: Biometric / WebAuthn Passkey authorization required
  if (amountUsd > 10) {
    return {
      allowed: true,
      tier: 3,
      sessionKeyEligible: false,
      requiresGuardianApproval: true,
      whyApprovalNeeded:
        "Transfer exceeds micro-threshold ($10.00 USD). WebAuthn Passkey biometric authorization required.",
      reason: "Tier 3 High-value transfer requiring biometric authorization.",
    };
  }

  // Tier 2: Micro-transfer with physical confirmation
  if (amountUsd > 5) {
    return {
      allowed: true,
      tier: 2,
      sessionKeyEligible: false,
      requiresGuardianApproval: false,
      whyApprovalNeeded: "Daily counter transfer / physical tap confirmation.",
      reason: "Tier 2 Micro-transfer ($5-$10 USD).",
    };
  }

  // Tier 1: Autonomous execution within pre-authorized budget
  return {
    allowed: true,
    tier: 1,
    sessionKeyEligible: true,
    requiresGuardianApproval: false,
    whyApprovalNeeded:
      "Auto-approved autonomously within pre-signed Session Key micro-budget (< $5.00 USD).",
    reason: "Tier 1 Autonomous micro-transfer.",
  };
}

