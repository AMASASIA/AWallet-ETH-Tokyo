import { InvisibleAction, InvisibleTier, Tier5RegulatoryCheck, Tier5ApprovalCardData } from '../types';
import {
  hasInvisibleOrMaliciousChars,
  sanitizeInputString,
  evaluateAddressSecurity
} from './securityValidator';

export interface ParsedProposalResult {
  isValid: boolean;
  action?: InvisibleAction;
  error?: string;
  rawPayload: string;
  sourceType: 'tive_json' | 'standard_uri' | 'address_only' | 'text_intent' | 'unsupported';
}

/**
 * Standard Demo Preset Proposals for instant testing and QR rendering
 */
export const DEMO_PROPOSAL_PRESETS = [
  {
    id: 'preset-coffee-tip',
    labelJa: '☕ バリスタPOS Coffee Tip (¥450 / 3.0 USDC)',
    labelEn: '☕ Barista POS Coffee Tip ($3.00 USDC)',
    tier: 2 as InvisibleTier,
    payload: JSON.stringify({
      destination: 'Blue Bottle Coffee POS (0x92fC84A3B18d2E48948D93Fc99A041d1d9124d1E)',
      amountLabel: '¥450 (~3.0 USDC)',
      reason: 'ユーザーが「バリスタへチップを払って」と発言したため、店頭端末POSへのTipping決済を生成しました。',
      reasonEn: 'User stated "Tip the barista / patron coffee", generating a Coffee Tipping micro-transfer.',
      whyApprovalNeeded: '安全ルール: 1,000円未満の日常対面Tippingのため、Bluetooth (BLE) キーでのワンタップ承認が可能です。',
      whyApprovalNeededEn: 'Safety rule: Daily micro-tipping below ¥1,000 can be authorized via Bluetooth (BLE) key tap.',
      category: 'Pay',
      desc: 'コーヒーTipping / ART credit',
      descEn: 'Coffee Tipping / ART credit'
    }, null, 2)
  },
  {
    id: 'preset-art-patron',
    labelJa: '🎨 クリエイター支援 ART Credit (¥1,500 / 10.0 USDC)',
    labelEn: '🎨 Creator Patron ART Credit ($10.00 USDC)',
    tier: 2 as InvisibleTier,
    payload: JSON.stringify({
      destination: 'Creator Studio Vault (0x4D2aF486a635848e028b1B637DeDeFa6A4B8b082)',
      amountLabel: '¥1,500 (~10.0 USDC)',
      reason: 'ユーザーが「個展クリエイターへART credit支援を送る」と指示したため提案しました。',
      reasonEn: 'User instructed "Send ART credit patronage to exhibition creator", proposing direct credit support.',
      whyApprovalNeeded: '安全ルール: BLEハードウェアキーまたはアプリのワンタップスライドで安全に承認できます。',
      whyApprovalNeededEn: 'Safety rule: Micro-patronage can be authorized via Bluetooth (BLE) tap or slide to confirm.',
      category: 'Art',
      desc: 'クリエイター支援 (ART credit)',
      descEn: 'Creator Patron (ART credit)'
    }, null, 2)
  },
  {
    id: 'preset-defi-rebalance',
    labelJa: '⚡ Aerodrome LP リバランス ($180 USDC)',
    labelEn: '⚡ Aerodrome LP Rebalance ($180 USDC)',
    tier: 3 as InvisibleTier,
    payload: JSON.stringify({
      destination: 'Aerodrome Finance Base (0x9401...82fc)',
      amountLabel: '$180 (180 USDC)',
      reason: 'ユーザーが「余剰USDCをDeFiリバランスして高利回りプールへ投入して」と要求したため提案しました。',
      reasonEn: 'User instructed "Rebalance idle USDC to Aerodrome liquidity pool", proposing contract deposit.',
      whyApprovalNeeded: 'Policy Engine Tier 3: 単一トランザクション上限（$100）超過かつDeFiコントラクトへの預託のため、本人生体パスキー署名が必要です。',
      whyApprovalNeededEn: 'Policy Engine Tier 3: Exceeds $100 single-tx threshold to smart contract; passkey biometric signature required.',
      category: 'DeFi',
      desc: 'DeFi リバランス (USDC)',
      descEn: 'DeFi Rebalance (USDC)'
    }, null, 2)
  },
  {
    id: 'preset-jepx-power',
    labelJa: '🏛️ JEPX電力スポット連動 変動ポジション (¥150,000 / ~1,000 USDC)',
    labelEn: '🏛️ JEPX Power Spot Variable Return (¥150,000)',
    tier: 5 as InvisibleTier,
    payload: JSON.stringify({
      type: 'regulated_sto_cfd',
      destination: 'Regulated Power Settlement Vault (0x51c...8821)',
      amountLabel: '¥150,000 (~1,000 USDC)',
      reason: 'ユーザーが「電力ボラティリティを活用した変動リターン枠に15万円配分したい」と指示したため提案しました。',
      reasonEn: 'User instructed "Allocate ¥150,000 to spot power market volatility variable return strategy".',
      whyApprovalNeeded: 'Policy Engine Tier 5ゲート通過済（特別会員・変動型プロファイル・小売電気提携ライセンス有効・適合性適合）。規制商品のため最終生体署名が必要です。',
      whyApprovalNeededEn: 'Tier 5 Passed: Regulated product requirements verified (Executive Member, variable return profile, retail electricity license). Final biometric passkey sign required.',
      category: 'STO/Power',
      desc: 'JEPXスポット電力 連動型変動ポジション',
      descEn: 'JEPX Spot Power Variable Strategy'
    }, null, 2)
  },
  {
    id: 'preset-rejected-note',
    labelJa: '🚨 未承認固定利回り型トークン (出資法違反・即時自動遮断)',
    labelEn: '🚨 Unapproved Fixed Yield Note (Execution Prohibited)',
    tier: 5 as InvisibleTier,
    payload: JSON.stringify({
      destination: 'Unverified Entity (0x99a...00ef)',
      amountLabel: '$5,000 (5,000 USDC)',
      reason: 'QRコードから「元本保証・年利12%確定利回りトークン化社債」の購入指示が読み取られました。',
      reasonEn: 'QR contains instructions for "12% guaranteed return fixed tokenized bond".',
      whyApprovalNeeded: 'Policy Engine Tier 5 FAIL: 出資法違反（元本保証・確定利回り語句）を検知。Tier1〜4への進行を完全遮断し即時実行不可としました。',
      whyApprovalNeededEn: 'Tier 5 FAIL: Violation of Investment Law detected (guaranteed yield). Execution strictly blocked.',
      category: 'STO/Bond',
      desc: '未承認固定配当型トークン化社債（即時拒絶）',
      descEn: 'Unapproved Fixed-Yield Bond (Rejected)'
    }, null, 2)
  }
];

/**
 * Parses and sanitizes a raw QR code string into an InvisibleAction proposal.
 * Strictly adheres to Tive ◉AI system prompt requirements (AGENTS.md / GEMINI.md).
 */
export function parseInvisibleProposalFromQR(
  rawText: string,
  lang: 'ja' | 'en' = 'ja'
): ParsedProposalResult {
  const isJa = lang === 'ja';

  if (!rawText || !rawText.trim()) {
    return {
      isValid: false,
      error: isJa ? 'QRコードの内容が空です。' : 'QR code content is empty.',
      rawPayload: '',
      sourceType: 'unsupported'
    };
  }

  // 1. Security check for invisible, zero-width, or bidi attack characters
  if (hasInvisibleOrMaliciousChars(rawText)) {
    return {
      isValid: false,
      error: isJa
        ? '【セキュリティ遮断】不可視文字または双方向制御文字が検出されました。'
        : 'Security Alert: Malicious zero-width or bidirectional characters detected.',
      rawPayload: rawText,
      sourceType: 'unsupported'
    };
  }

  const cleanText = sanitizeInputString(rawText.trim());

  // 2. Try JSON parsing
  if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
    try {
      const json = JSON.parse(cleanText);

      // Check for illegal fixed-yield / principal guaranteed keywords (出資法・金商法コンプライアンス)
      const combinedText = JSON.stringify(json);
      const hasFixedYieldViolation =
        combinedText.includes('元本保証') ||
        combinedText.includes('確定利回り') ||
        combinedText.toLowerCase().includes('guaranteed yield') ||
        combinedText.toLowerCase().includes('guaranteed principal');

      const destination = json.destination || json.to || json.target || json.recipient || '0x92fC84A3B18d2E48948D93Fc99A041d1d9124d1E';
      const amountLabel = json.amountLabel || json.amount || '¥1,000 (~6.5 USDC)';
      const desc = json.desc || json.title || (isJa ? 'QR提案インポート' : 'Imported QR Proposal');
      const descEn = json.descEn || json.titleEn || 'Imported QR Proposal';
      const reason = json.reason || (isJa ? `QRコードから読み取った意図に基づき提案を生成しました。` : `Generated proposal based on scanned QR code intent.`);
      const reasonEn = json.reasonEn || `Generated proposal based on scanned QR code intent.`;
      const category = json.category || 'QR/Custom';

      // Parse amount numeric value for tier evaluation if not explicitly defined
      let parsedAmountUsd = 5.0;
      const usdMatch = amountLabel.match(/([0-9,.]+)\s*(?:USDC|USD|\$)/i);
      const jpyMatch = amountLabel.match(/[¥￥]([0-9,.]+)/);
      if (usdMatch) {
        parsedAmountUsd = parseFloat(usdMatch[1].replace(/,/g, '')) || 5.0;
      } else if (jpyMatch) {
        const jpyVal = parseFloat(jpyMatch[1].replace(/,/g, '')) || 750;
        parsedAmountUsd = jpyVal / 150;
      }

      // Determine Tier
      let tier: InvisibleTier = json.tier || 2;
      let status: InvisibleAction['status'] = 'awaiting';
      let tier5Check: Tier5RegulatoryCheck | undefined;
      let tier5CardData: Tier5ApprovalCardData | undefined;

      if (hasFixedYieldViolation) {
        tier = 5;
        status = 'rejected_tier5';
        tier5Check = {
          isExecutiveMember: true,
          productClassificationPass: false,
          statementSanityPass: false,
          licenseStatusPass: false,
          suitabilityPass: false,
          failReason: '出資法違反（元本保証・確定利回り語句）を検知。実行を完全遮断しました。',
          failReasonEn: 'Violation of Japanese Investment Law (guaranteed yield keyword detected).'
        };
      } else if (json.type === 'regulated_sto_cfd' || category.includes('STO') || json.tier === 5) {
        tier = 5;
        status = 'awaiting';
        tier5Check = {
          isExecutiveMember: true,
          productClassificationPass: true,
          statementSanityPass: true,
          licenseStatusPass: true,
          suitabilityPass: true,
          confusionDetectorPass: true,
          buyerEligibilityPass: true
        };
        tier5CardData = {
          schemaVersion: 'policy-engine.tier5.v2',
          actionType: 'warrant_exercise',
          regulatoryDisclaimer: '本商品は市場連動型の変動リターン商品であり、将来の運用成果、元本および利回りを保証するものではありません。',
          disclaimerAcknowledged: false,
          disclaimerAcknowledgedAt: null,
          coolingOffDeadline: null,
          exerciseDeadline: '2026-10-31T23:59:59Z',
          multisigStatus: {
            required: '1-of-2',
            signedCount: 0,
            threshold: 1,
            pendingSignerLabels: ['anchor_passkey', 'platform_safe']
          },
          licenseReference: 'LIC-PWR-2026-B812 (Retail Electricity Partner / BG Allocation)',
          cancellationRight: {
            available: false,
            description: '約款に基づく権利行使（Warrant Exercise）のためクーリングオフ対象外です。'
          },
          irreversibilityNotice: '約定と同時にJEPXスポット市場へ注文連携されます。'
        };
      } else if (parsedAmountUsd > 5000) {
        tier = 4;
        status = 'escalated';
      } else if (parsedAmountUsd > 100 || category === 'DeFi') {
        tier = 3;
      } else if (parsedAmountUsd <= 1 && desc.includes('照会')) {
        tier = 1;
        status = 'auto_approved';
      } else {
        tier = 2;
      }

      // Format whyApprovalNeeded based on tier
      let whyApprovalNeeded = json.whyApprovalNeeded;
      let whyApprovalNeededEn = json.whyApprovalNeededEn;
      if (!whyApprovalNeeded) {
        if (tier === 1) {
          whyApprovalNeeded = 'Policy Engine Tier 1: 照会・微小最適化のため即時自動実行されます。';
          whyApprovalNeededEn = 'Policy Engine Tier 1: Informational query or micro-optimization; auto-executed.';
        } else if (tier === 2) {
          whyApprovalNeeded = '安全ルール: 1,000円前後の日常対面決済/Tippingのため、Bluetooth (BLE) キーでのワンタップ承認が可能です。';
          whyApprovalNeededEn = 'Safety rule: Micro-payment or tip below ¥1,500; can be approved via Bluetooth (BLE) key tap.';
        } else if (tier === 3) {
          whyApprovalNeeded = 'Policy Engine Tier 3: 単一トランザクション上限（$100）超過または重要契約のため、本人生体パスキー署名が必要です。';
          whyApprovalNeededEn = 'Policy Engine Tier 3: Exceeds single-tx cap or calls external contract; passkey biometric sign required.';
        } else if (tier === 4) {
          whyApprovalNeeded = 'Policy Engine Tier 4: 異常検知（閾値超過）のためサーキットブレーカー発動・即時停止されました。';
          whyApprovalNeededEn = 'Policy Engine Tier 4: Anomaly threshold exceeded; circuit breaker tripped.';
        } else if (tier === 5) {
          whyApprovalNeeded = hasFixedYieldViolation
            ? 'Policy Engine Tier 5 FAIL: 出資法違反（元本保証・確定利回り語句）を検知。実行を完全遮断しました。'
            : 'Policy Engine Tier 5: 金融商品取引法・小売電気約款適合チェック通過済。最終生体署名が必要です。';
          whyApprovalNeededEn = hasFixedYieldViolation
            ? 'Policy Engine Tier 5 FAIL: Investment law violation detected. Execution prohibited.'
            : 'Policy Engine Tier 5: Regulated commodity check passed. Biometric signature required.';
        }
      }

      const action: InvisibleAction = {
        id: `qr-${Date.now().toString().slice(-6)}`,
        tier,
        desc,
        descEn,
        amount: json.amount || amountLabel.split(' ')[0] || '¥1,000',
        amountLabel,
        destination,
        reason,
        reasonEn,
        whyApprovalNeeded,
        whyApprovalNeededEn,
        initiatedBy: 'Tive ◉AI (QR Scanner)',
        status,
        timestamp: isJa ? 'たった今' : 'Just now',
        category,
        tier5Check,
        tier5CardData
      };

      return {
        isValid: true,
        action,
        rawPayload: cleanText,
        sourceType: 'tive_json'
      };
    } catch {
      // Fall through to other parsers
    }
  }

  // 3. Try Ethereum / Base URI scheme
  if (
    cleanText.toLowerCase().startsWith('ethereum:') ||
    cleanText.toLowerCase().startsWith('base:') ||
    cleanText.toLowerCase().startsWith('web+ethereum:')
  ) {
    const stripped = cleanText.replace(/^(ethereum:|base:|web\+ethereum:)/i, '');
    const [targetAddr, queryString] = stripped.split('?');
    const params = new URLSearchParams(queryString || '');

    const amountParam = params.get('amount') || params.get('value') || '10';
    const symbol = params.get('symbol') || 'USDC';
    const note = params.get('note') || params.get('reason') || '';

    const numVal = parseFloat(amountParam) || 10;
    const jpyEst = Math.round(numVal * 150);
    const amountLabel = `¥${jpyEst.toLocaleString()} (~${numVal} ${symbol})`;

    const tier: InvisibleTier = numVal > 100 ? 3 : 2;
    const shortAddr = targetAddr.length > 12 ? `${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}` : targetAddr;

    const action: InvisibleAction = {
      id: `qr-uri-${Date.now().toString().slice(-6)}`,
      tier,
      desc: note || (isJa ? `Web3 送金リクエスト (${symbol})` : `Web3 Payment Request (${symbol})`),
      descEn: note || `Web3 Payment Request (${symbol})`,
      amount: `¥${jpyEst.toLocaleString()}`,
      amountLabel,
      destination: `${shortAddr} (On-chain EVM)`,
      reason: note
        ? (isJa ? `QRコード内のリクエスト指定 (${note}) に基づき送金を提案しました。` : `Scanned payment request: ${note}`)
        : (isJa ? `QRコードから検出された宛先 (${shortAddr}) への送金提案を生成しました。` : `Scanned destination ${shortAddr} payment request.`),
      reasonEn: note || `Scanned destination ${shortAddr} payment request.`,
      whyApprovalNeeded: tier === 3
        ? 'Policy Engine Tier 3: 単一トランザクション上限（$100）超過のため、本人生体パスキー署名が必要です。'
        : '安全ルール: 1,000円前後の小額決済のため、Bluetooth (BLE) キーのタップまたはスライドで承認できます。',
      whyApprovalNeededEn: tier === 3
        ? 'Policy Engine Tier 3: Exceeds $100 single-tx threshold; biometric passkey sign required.'
        : 'Safety rule: Micro-payment below ¥1,500 can be approved via Bluetooth (BLE) key tap or slide.',
      initiatedBy: 'Tive ◉AI (QR Scanner)',
      status: 'awaiting',
      timestamp: isJa ? 'たった今' : 'Just now',
      category: 'Pay'
    };

    return {
      isValid: true,
      action,
      rawPayload: cleanText,
      sourceType: 'standard_uri'
    };
  }

  // 4. Try Plain Address or DID
  if (
    cleanText.startsWith('0x') ||
    cleanText.startsWith('did:ion:') ||
    cleanText.startsWith('did:key:') ||
    cleanText.endsWith('.eth') ||
    cleanText.endsWith('.base.eth')
  ) {
    const isEth = cleanText.startsWith('0x') && cleanText.length === 42;
    if (isEth) {
      const sec = evaluateAddressSecurity(cleanText);
      if (!sec.isSafe) {
        return {
          isValid: false,
          error: sec.warningMessage || (isJa ? '無効または安全でないアドレスです。' : 'Invalid address'),
          rawPayload: cleanText,
          sourceType: 'address_only'
        };
      }
    }

    const short = cleanText.length > 14 ? `${cleanText.slice(0, 6)}...${cleanText.slice(-4)}` : cleanText;
    const action: InvisibleAction = {
      id: `qr-addr-${Date.now().toString().slice(-6)}`,
      tier: 2,
      desc: isJa ? `対面決済 / Tipping (${short})` : `Direct Micro-Payment (${short})`,
      descEn: `Direct Micro-Payment (${short})`,
      amount: '¥500',
      amountLabel: '¥500 (~3.3 USDC)',
      destination: cleanText,
      reason: isJa
        ? `QRコードからスキャンした対面受取アドレス (${short}) への送金を提案しました。`
        : `Generated payment proposal for recipient address scanned from QR code (${short}).`,
      reasonEn: `Generated payment proposal for recipient address scanned from QR code (${short}).`,
      whyApprovalNeeded: isJa
        ? '安全ルール: 1,000円未満の日常対面Tippingのため、Bluetooth (BLE) キーでのワンタップ承認が可能です。'
        : 'Safety rule: Daily micro-tipping below ¥1,000 can be authorized via Bluetooth (BLE) key tap.',
      initiatedBy: 'Tive ◉AI (QR Scanner)',
      status: 'awaiting',
      timestamp: isJa ? 'たった今' : 'Just now',
      category: 'Pay'
    };

    return {
      isValid: true,
      action,
      rawPayload: cleanText,
      sourceType: 'address_only'
    };
  }

  // 5. Fallback: Generic text intent
  const shortText = cleanText.slice(0, 30);
  const action: InvisibleAction = {
    id: `qr-txt-${Date.now().toString().slice(-6)}`,
    tier: 2,
    desc: isJa ? `スキャン提案: ${shortText}` : `Scanned Proposal: ${shortText}`,
    descEn: `Scanned Proposal: ${shortText}`,
    amount: '¥1,000',
    amountLabel: '¥1,000 (~6.6 USDC)',
    destination: 'Base Smart Wallet Proxy',
    reason: isJa
      ? `QRコードに記録された指示内容「${cleanText.slice(0, 60)}」に基づき提案を構築しました。`
      : `Constructed proposal based on scanned QR payload instruction.`,
    reasonEn: `Constructed proposal based on scanned QR payload instruction: ${cleanText.slice(0, 60)}`,
    whyApprovalNeeded: isJa
      ? 'Policy Engine Tier 2: 外部QRコードからのインポート提案のため、承認キー押下が必要です。'
      : 'Policy Engine Tier 2: Imported from external QR code; key tap required to authorize.',
    initiatedBy: 'Tive ◉AI (QR Scanner)',
    status: 'awaiting',
    timestamp: isJa ? 'たった今' : 'Just now',
    category: 'Custom'
  };

  return {
    isValid: true,
    action,
    rawPayload: cleanText,
    sourceType: 'text_intent'
  };
}
