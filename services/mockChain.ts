import { InvisibleAction, InvisibleTier, NFTItem, Proposal, SBT, Token, User } from '../types';

// Initial User on Base
export const INITIAL_USER: User = {
  address: '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01',
  baseName: 'alex.base.eth',
  did: 'did:key:z6Mkq4G...base99',
  name: 'Alex Rivera',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  network: 'Base Mainnet',
};

export const INITIAL_TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 1.4520,
    priceUsd: 3120.50,
    change24h: '+5.76%',
    sparkline: [45, 52, 48, 65, 58, 72, 70, 84],
    network: 'Base L2',
    icon: 'ETH',
    isNative: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 840.50,
    priceUsd: 1.00,
    change24h: '+0.01%',
    sparkline: [50, 50, 51, 50, 50, 50, 50, 50],
    network: 'Base L2',
    icon: 'USDC',
    isNative: false,
  },
  {
    symbol: 'cbBTC',
    name: 'Coinbase Wrapped BTC',
    balance: 0.0450,
    priceUsd: 68420.00,
    change24h: '+3.28%',
    sparkline: [55, 60, 58, 64, 62, 70, 75, 78],
    network: 'Base L2',
    icon: 'BTC',
    isNative: false,
  },
  {
    symbol: 'AERO',
    name: 'Aerodrome Finance',
    balance: 620.00,
    priceUsd: 0.82,
    change24h: '+12.4%',
    sparkline: [30, 42, 38, 55, 62, 60, 78, 85],
    network: 'Base L2',
    icon: 'AERO',
    isNative: false,
  },
  {
    symbol: 'DEGEN',
    name: 'Degen on Base',
    balance: 12500.00,
    priceUsd: 0.0084,
    change24h: '-4.12%',
    sparkline: [70, 68, 60, 65, 55, 58, 50, 48],
    network: 'Base L2',
    icon: 'DEGEN',
    isNative: false,
  },
];

export const MAINNET_TOKENS: Token[] = INITIAL_TOKENS;

export const TESTNET_TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Sepolia Ether',
    balance: 0.5000,
    priceUsd: 3120.50,
    change24h: '+0.00%',
    sparkline: [50, 50, 50, 50, 50, 50, 50, 50],
    network: 'Base Sepolia',
    icon: 'ETH',
    isNative: true,
  },
  {
    symbol: 'USDC',
    name: 'Sepolia USDC',
    balance: 500.00,
    priceUsd: 1.00,
    change24h: '+0.00%',
    sparkline: [50, 50, 50, 50, 50, 50, 50, 50],
    network: 'Base Sepolia',
    icon: 'USDC',
    isNative: false,
  },
  {
    symbol: 'ART',
    name: 'Tive ART Credit',
    balance: 1200.00,
    priceUsd: 0.15,
    change24h: '+2.50%',
    sparkline: [12, 14, 15, 14, 16, 17, 18, 20],
    network: 'Base Sepolia',
    icon: 'ART',
    isNative: false,
  },
];

export const INITIAL_SBTS: SBT[] = [
  { id: '1', name: 'Coinbase Verified ID', type: 'Identity', issuer: 'coinbase.eth', issueDate: '2024-02-14' },
  { id: '2', name: 'Base Builder Credential', type: 'Reputation', issuer: 'base.eth', issueDate: '2024-03-01' },
  { id: '3', name: 'Safe Multisig Guardian', type: 'Role', issuer: 'safe.base.eth', issueDate: '2024-05-18' },
];

export const INITIAL_NFTS: NFTItem[] = [
  {
    id: 'nft-1',
    collectionName: 'Based Punks',
    tokenId: '#4289',
    name: 'Based Punk #4289',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop&q=80',
    floorPriceEth: 0.45,
    estimatedUsd: 1404.22,
    network: 'Base',
    rarity: 'Legendary',
    contractAddress: '0x21c4...5a1b',
    description: 'Autonomous cyberpunk avatar generated natively on Base L2 blockchain with verified smart wallet ownership.',
    attributes: [
      { trait_type: 'Skin', trait_value: 'Cyber Metallic', value: 'Cyber Metallic' },
      { trait_type: 'Headwear', trait_value: 'Base Visor', value: 'Base Visor' },
      { trait_type: 'Background', trait_value: 'Deep Blue', value: 'Deep Blue' },
    ],
  },
  {
    id: 'nft-2',
    collectionName: 'Base Onchain Summer',
    tokenId: '#1820',
    name: 'Onchain Summer #1820',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    floorPriceEth: 0.12,
    estimatedUsd: 374.46,
    network: 'Base',
    rarity: 'Rare',
    contractAddress: '0x7e88...c491',
    description: 'Commemorative digital artifact celebrating builder onboarding during Base Onchain Summer 2024.',
    attributes: [
      { trait_type: 'Season', trait_value: 'Summer 2024', value: 'Summer 2024' },
      { trait_type: 'Vibe', trait_value: 'Optimistic Yellow', value: 'Optimistic Yellow' },
      { trait_type: 'Edition', trait_value: 'Early Adopter', value: 'Early Adopter' },
    ],
  },
  {
    id: 'nft-3',
    collectionName: 'Aerodrome Pioneers',
    tokenId: '#0088',
    name: 'Aero Pioneer #0088',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop&q=80',
    floorPriceEth: 0.85,
    estimatedUsd: 2652.42,
    network: 'Base',
    rarity: 'Epic',
    contractAddress: '0x9401...82fc',
    description: 'Founding liquidity and governance pioneer pass on Base largest decentralized liquidity hub.',
    attributes: [
      { trait_type: 'Tier', trait_value: 'Founding Member', value: 'Founding Member' },
      { trait_type: 'Boost', trait_value: '1.25x veAERO', value: '1.25x veAERO' },
      { trait_type: 'Badge', trait_value: 'Genesis', value: 'Genesis' },
    ],
  },
  {
    id: 'nft-4',
    collectionName: 'Tiny Based Frogs',
    tokenId: '#0614',
    name: 'Based Frog #0614',
    imageUrl: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?w=500&auto=format&fit=crop&q=80',
    floorPriceEth: 0.08,
    estimatedUsd: 249.64,
    network: 'Base',
    rarity: 'Uncommon',
    contractAddress: '0x32ba...11dd',
    description: '100% onchain SVG pixel companion hopping across Base rollups.',
    attributes: [
      { trait_type: 'Species', trait_value: 'Treefrog', value: 'Treefrog' },
      { trait_type: 'Expression', trait_value: 'Zen', value: 'Zen' },
      { trait_type: 'Accessory', trait_value: 'Coffee Mug', value: 'Coffee Mug' },
    ],
  },
];

export const INITIAL_PROPOSALS: Proposal[] = [
  { 
    id: 'prop-base-101', 
    title: 'Fund Base Ecosystem Community Grants', 
    description: 'Allocate 250 USDC for on-chain Base Builder mini-hackathon', 
    to: 'builders.base.eth', 
    amount: 250, 
    symbol: 'USDC', 
    approvals: 2, 
    threshold: 3, 
    status: 'Pending', 
    timestamp: '2024-05-10T10:00:00Z' 
  },
  { 
    id: 'prop-base-102', 
    title: 'Provide Liquidity to Aerodrome Pool', 
    description: 'Add 0.25 ETH to ETH-cbBTC liquidity pool on Base', 
    to: '0x8453...pool', 
    amount: 0.25, 
    symbol: 'ETH', 
    approvals: 3, 
    threshold: 3, 
    status: 'Pending', 
    timestamp: '2024-05-11T14:30:00Z' 
  }
];

// Simulation Helper Functions
export const resolveDID = async (val: string): Promise<string> => {
  await new Promise(r => setTimeout(r, 600));
  const trimmed = val.trim();
  if (trimmed.endsWith('.base.eth') || trimmed.endsWith('.eth')) {
    return `0x8453${trimmed.slice(0, 4).toUpperCase()}...${trimmed.slice(-4)}`;
  }
  if (trimmed.startsWith('did:key:') || trimmed.startsWith('did:ion:')) {
    return `0x${trimmed.slice(8, 14)}...BaseResolved`;
  }
  if (trimmed.startsWith('0x') && trimmed.length >= 10) {
    return trimmed;
  }
  throw new Error("Invalid DID or ENS format");
};

export const formatAddress = (addr: string) => {
  if (!addr) return '';
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export const registerDID = async (publicKey: string): Promise<string> => {
  await new Promise(r => setTimeout(r, 1200));
  return `did:key:z6Mk${publicKey.slice(2, 8)}...base${Date.now().toString().slice(-4)}`;
};

// ============================================================================
// Legacy / Enclave / Simulation Modules [Status: Non-active / Future-use]
// Primary architecture uses Base Smart Wallet (ERC-4337) and Passkey authentication.
// The Safe multisig simulation below is preserved for future multi-tenant modules.
// ============================================================================
export const deployMultisig = async (owners: string[], threshold: number): Promise<string> => {
  await new Promise(r => setTimeout(r, 1800));
  return `0xSafeBase${Date.now().toString().slice(-6)}`;
};

// Invisible Finance — actions Tive ◉AI has proposed, gated by Policy Engine tier
export const TIER_INFO: Record<
  InvisibleTier,
  { label: string; descJa: string; descEn: string; auto: boolean; blocked?: boolean; badgeColor: string }
> = {
  1: {
    label: 'Tier 1',
    descJa: '自動実行',
    descEn: 'Auto',
    auto: true,
    badgeColor: 'border-emerald-800/60 text-emerald-400 bg-emerald-950/30',
  },
  2: {
    label: 'Tier 2',
    descJa: 'Bluetooth (BLE) 承認',
    descEn: 'Bluetooth (BLE) Tap',
    auto: false,
    badgeColor: 'border-blue-800/60 text-blue-400 bg-blue-950/30',
  },
  3: {
    label: 'Tier 3',
    descJa: '本人署名',
    descEn: 'Passkey Sign',
    auto: false,
    badgeColor: 'border-amber-800/60 text-amber-400 bg-amber-950/30',
  },
  4: {
    label: 'Tier 4',
    descJa: '自動停止',
    descEn: 'Blocked',
    auto: false,
    blocked: true,
    badgeColor: 'border-rose-800/60 text-rose-400 bg-rose-950/30',
  },
  5: {
    label: 'Tier 5',
    descJa: '規制商品ゲート (STO/CFD/電力)',
    descEn: 'Regulatory Gate (Executive)',
    auto: false,
    blocked: false,
    badgeColor: 'border-purple-800/60 text-purple-300 bg-purple-950/30',
  },
};

export const INITIAL_INVISIBLE_ACTIONS: InvisibleAction[] = [
  {
    id: 'act-1',
    tier: 2,
    desc: 'コーヒーTipping / ART credit',
    descEn: 'Coffee Tipping / ART credit',
    amount: '¥480',
    amountLabel: '¥480 (~3.15 USDC)',
    destination: 'Blue Bottle Coffee (0x92f...4d1e)',
    reason: 'ユーザーが「バリスタへチップを払って」と発言したため、店頭端末POSへのTipping決済を生成しました。',
    reasonEn: 'User stated "Tip the barista / credit art creator", generating a Coffee Tipping / ART credit micro-transfer.',
    whyApprovalNeeded: '安全ルール: 1,000円未満の日常対面Tippingのため、Bluetooth (BLE) キーでのワンタップ承認が可能です。',
    whyApprovalNeededEn: 'Safety rule: Daily micro-tipping can be authorized via Bluetooth (BLE) key tap.',
    initiatedBy: 'Tive ◉AI',
    status: 'awaiting',
    timestamp: '5m ago',
    category: 'Pay',
  },
  {
    id: 'act-2',
    tier: 3,
    desc: 'サブスク上限変更',
    descEn: 'Raise Subscription Limit',
    amount: '$120',
    amountLabel: '$120 / month (120 USDC)',
    destination: 'Cloud Host Co. (0x81b...9a04)',
    reason: 'ユーザーが「今月からサーバーのサブスク枠を月120ドルに引き上げたい」と指示したため設定変更を提案しました。',
    reasonEn: 'User instructed "Increase server subscription budget to $120/month", proposing limit expansion.',
    whyApprovalNeeded: 'Policy Engine Tier 3: 経常的な引き落とし上限変更（$100超）のため、本人による生体パスキー署名が必要です。',
    whyApprovalNeededEn: 'Policy Engine Tier 3: Recurring spend limit change (>$100) requires explicit passkey biometric authentication.',
    initiatedBy: 'Tive ◉AI',
    status: 'awaiting',
    timestamp: '15m ago',
    category: 'Sub',
  },
  {
    id: 'act-3',
    tier: 1,
    desc: '残高・最適化照会',
    descEn: 'Balance Optimization Check',
    amount: '—',
    amountLabel: '$0.00 (Read-only query)',
    destination: 'Base / Aave v3 Pool (0x3fa...71c2)',
    reason: 'ユーザーが「現在のステーブルコイン運用利回りを教えて」と尋ねたため、最新利回りとガス最適化ルートを取得しました。',
    reasonEn: 'User asked "What is my current yield on stablecoins?", querying current pool stats and optimal routes.',
    whyApprovalNeeded: 'Policy Engine Tier 1: 読み取り専用の情報照会であり資金移動を伴わないため、事前ポリシーに基づき自動実行されました。',
    whyApprovalNeededEn: 'Policy Engine Tier 1: Read-only query with zero asset movement; executed autonomously by policy.',
    initiatedBy: 'Tive ◉AI',
    status: 'auto_approved',
    timestamp: '1h ago',
    category: 'Query',
  },
  {
    id: 'act-4',
    tier: 4,
    desc: '高額海外送金 (要確認)',
    descEn: 'Large Foreign Transfer (Blocked)',
    amount: '$2,400',
    amountLabel: '$2,400 (2,400 USDC / 0.85 ETH)',
    destination: 'Unverified External Vault (0x44d...881f)',
    reason: 'チャット内の外部URLリンクに基づく送金要求が検知されました。過去の取引実績がない新規アドレスです。',
    reasonEn: 'Transfer request triggered via external link. Recipient is a newly created, unverified address.',
    whyApprovalNeeded: 'Policy Engine Tier 4: 単一取引上限（$1,000）超過かつ未登録の新規送金先のため、サーキットブレーカーが発動し安全停止されました。',
    whyApprovalNeededEn: 'Policy Engine Tier 4: Exceeds single-transaction threshold ($1,000) to an unverified target. Circuit breaker tripped.',
    initiatedBy: 'Tive ◉AI',
    status: 'escalated',
    timestamp: '2h ago',
    category: 'Alert',
  },
  {
    id: 'act-5',
    tier: 5,
    desc: '金CFD変動リターン型ポジション構築',
    descEn: 'Gold CFD Variable-Return Position',
    amount: '$5,000',
    amountLabel: '$5,000 (~33.5g Au equiv / 5,000 USDC)',
    destination: 'Licensed Commodity Vault (0x7aa...3c81)',
    reason: 'ユーザーが「エグゼクティブ会員特典の貴金属変動リターン戦略に5,000ドル分散したい」と発言したため、ポートフォリオ案を作成しました。',
    reasonEn: 'User requested "Allocate $5,000 to Gold variable-return strategy under executive membership".',
    whyApprovalNeeded: 'Policy Engine Tier 5ゲート通過済（特別会員認証・変動型プロファイル・第一種金商業ライセンス有効・適合性適合）。規制商品のため本人生体認証による最終約定が必要です。',
    whyApprovalNeededEn: 'Tier 5 Gate Passed (Executive status, variable profile, license valid, suitability pass). Regulatory product requires biometric sign.',
    initiatedBy: 'Tive ◉AI',
    status: 'awaiting',
    timestamp: '10m ago',
    category: 'STO/CFD',
    tier5Check: {
      isExecutiveMember: true,
      productClassificationPass: true,
      statementSanityPass: true,
      licenseStatusPass: true,
      suitabilityPass: true,
      confusionDetectorPass: true,
      buyerEligibilityPass: true,
    },
    tier5CardData: {
      schemaVersion: 'policy-engine.tier5.v2',
      actionType: 'warrant_exercise',
      regulatoryDisclaimer: '本商品は変動リターン型であり、将来の運用成果、元本および利回りを保証するものではありません。金価格およびスプレッドの変動リスクを伴います。',
      disclaimerAcknowledged: false,
      disclaimerAcknowledgedAt: null,
      coolingOffDeadline: null,
      exerciseDeadline: '2026-10-15T23:59:59Z',
      multisigStatus: {
        required: '1-of-2',
        signedCount: 0,
        threshold: 1,
        pendingSignerLabels: ['anchor_biometric', 'platform_safe_operator'],
      },
      governanceStatus: {
        required: false,
        threshold: '3-of-5',
        status: 'not_applicable',
      },
      licenseReference: 'LIC-CFD-2026-T881 (Type-1 Financial Instruments / Commodity Derivatives Partner)',
      cancellationRight: {
        available: false,
        description: '本操作は既存の約款に基づく権利行使（Warrant Exercise）のためクーリングオフ対象外です。',
      },
      irreversibilityNotice: 'この操作は約定後直ちにオンチェーンポジションとして記録され、取り消しはできません。',
    },
  },
  {
    id: 'act-6',
    tier: 5,
    desc: '未承認固定利回り型電力債権（即時拒絶）',
    descEn: 'Unauthorized Fixed-Yield Power Note (Blocked)',
    amount: '¥1,000,000',
    amountLabel: '¥1,000,000 (10,000 USDC)',
    destination: 'Unlicensed Operator (0x991...1b22)',
    reason: '外部チャットで「年利8%確定利回りJEPX電力債権」の購入要求が送出されました。',
    reasonEn: 'Inbound prompt requested purchase of "8% guaranteed fixed-yield power note".',
    whyApprovalNeeded: 'Policy Engine Tier 5 FAIL: 出資法および金商法規制違反を検知（確定利回り・保証文言の検知、ライセンス未取得先）。Tier1〜4への進行を完全遮断し即時実行不可としました。',
    whyApprovalNeededEn: 'Tier 5 Gate FAIL: Investment law violation detected (guaranteed yield keyword, unlicensed partner). Strictly blocked.',
    initiatedBy: 'Tive ◉AI',
    status: 'rejected_tier5',
    timestamp: '25m ago',
    category: 'STO/Power',
    tier5Check: {
      isExecutiveMember: true,
      productClassificationPass: false,
      statementSanityPass: false,
      licenseStatusPass: false,
      suitabilityPass: false,
      confusionDetectorPass: false,
      buyerEligibilityPass: false,
      failReason: '出資法2条違反（確定利回り約束）および金融商品取引業ライセンス未確認のため、Policy Engineが決定論的に実行不可と判定しました。',
      failReasonEn: 'Detected prohibited fixed-yield commitment and missing Type-1 Financial Instruments license.',
    },
    tier5CardData: {
      schemaVersion: 'policy-engine.tier5.v2',
      actionType: 'issuance',
      regulatoryDisclaimer: '本商品は変動リターン型であり、元本および利回りを保証するものではありません。',
      disclaimerAcknowledged: false,
      disclaimerAcknowledgedAt: null,
      coolingOffDeadline: null,
      licenseReference: 'UNLICENSED_OPERATOR_REJECTED',
      cancellationRight: {
        available: false,
        description: '規制ゲート拒絶のため申込自体が無効です。',
      },
      irreversibilityNotice: 'Policy Engineにより事前遮断されました。',
    },
  },
  {
    id: 'act-7',
    tier: 5,
    desc: '新規STO 業績連動型デジタル社債発行申込',
    descEn: 'New STO Variable Digital Bond Issuance',
    amount: '¥500,000',
    amountLabel: '¥500,000 (~3,350 USDC / 100 STO Units)',
    destination: 'Licensed STO Settlement Vault (0x7aa...3c81)',
    reason: 'ユーザーが「エグゼクティブ枠で業績連動型デジタル社債（シリーズB）を50万円分申し込みたい」と指示したため提案しました。',
    reasonEn: 'User instructed "Apply for 500,000 JPY variable-return STO Digital Bond Series B under executive allocation".',
    whyApprovalNeeded: 'Policy Engine Tier 5: 新規出資契約（ISSUANCE）のため、8日間の無条件クーリングオフ権利付与および platform Safe 2-of-3 マルチシグ承認が必要です。',
    whyApprovalNeededEn: 'Policy Engine Tier 5: New issuance requires 8-day cooling-off window & Safe 2-of-3 approval.',
    initiatedBy: 'Tive ◉AI',
    status: 'cooling_off',
    timestamp: '45m ago',
    category: 'STO/Bond',
    tier5Check: {
      isExecutiveMember: true,
      productClassificationPass: true,
      statementSanityPass: true,
      licenseStatusPass: true,
      suitabilityPass: true,
      confusionDetectorPass: true,
      buyerEligibilityPass: true,
    },
    tier5CardData: {
      schemaVersion: 'policy-engine.tier5.v2',
      actionType: 'issuance',
      regulatoryDisclaimer: '本商品は業績連動型の変動リターン商品であり、将来の運用成果、元本および利回りを保証するものではありません。',
      disclaimerAcknowledged: true,
      disclaimerAcknowledgedAt: '2026-09-12T12:20:00Z',
      coolingOffDeadline: '2026-09-20T12:00:00Z',
      exerciseDeadline: null,
      multisigStatus: {
        required: '2-of-3',
        signedCount: 1,
        threshold: 2,
        pendingSignerLabels: ['platform_safe_operator_1', 'platform_safe_operator_2'],
      },
      governanceStatus: {
        required: false,
        threshold: '3-of-5',
        status: 'not_applicable',
      },
      licenseReference: 'LIC-STO-2026-K099 (Electronic Record Transfer Rights / Type-1 FI Operator)',
      cancellationRight: {
        available: true,
        description: '2026年9月20日 12:00 UTC まで、アンカーは手数料・違約金なしで無条件・無理由でキャンセル可能です。',
      },
      irreversibilityNotice: 'クーリングオフ期間満了後は、システム起因誤発注や不正アクセス等の客観的例外を除き、出資契約の取消はできません。',
    },
  },
];


