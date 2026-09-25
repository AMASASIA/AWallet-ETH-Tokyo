export interface Token {
  id?: string;
  name: string;
  symbol: string;
  balance: number;      // raw token balance
  priceUsd?: number;
  change24h?: string | number;
  sparkline?: number[];
  network?: string;
  isNative?: boolean;
  address?: string;
  decimals?: number;
  icon?: string;
}

export interface User {
  address: string;
  did: string;
  name: string;
  avatar: string;
  network?: string;
  baseName?: string;
}

export interface SBT {
  id: string;
  name: string;
  type: string;
  issueDate: string;
  issuer: string;
}

export interface NFTItem {
  id: string;
  collectionName: string;
  tokenId: string;
  name: string;
  imageUrl: string;
  floorPriceEth: number;
  estimatedUsd?: number;
  network: string;
  rarity?: string;
  contractAddress?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string; trait_value?: string }>;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  amount: number;
  symbol: string;
  to: string;
  approvals: number;
  threshold: number;
  status: 'Pending' | 'Executed';
  timestamp?: string;
}

export interface Activity {
  id: string;
  type: 'Transfer' | 'Mint' | 'Approval' | 'Execution' | 'Swap' | 'Policy';
  detail: string;
  timestamp: string;
  hash?: string;
}

// --- 1inch Fusion Types ---
export interface FusionQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount: number;
  estimatedGasFeeUsd: number; // 0 for Fusion (resolver pays)
  auctionDurationSec: number;
  minToAmount: number;
  rate: number;
  mevProtected: boolean;
  simulated?: boolean;
  source?: string;
  policy?: any;
  tier?: number;
}

export interface FusionOrder {
  orderHash: string;
  status: 'auction' | 'settled' | 'expired';
  fromTokenSymbol: string;
  toTokenSymbol: string;
  fromAmount: number;
  toAmount: number;
  createdAt: string;
}

// --- Session Key & Circuit Breaker / Policy Engine Types ---
export interface SessionKey {
  id: string;
  publicKey: string;
  label: string;
  validUntil: number; // timestamp
  singleTxLimitUsd: number;
  allowedTargets: string[]; // addresses or '*'
  createdAt: string;
  active: boolean;
}

export type CircuitBreakerStatus = 'NORMAL' | 'TRIPPED' | 'MAINTENANCE';

export interface PolicyEngineConfig {
  dailySpendCapUsd: number;
  dailySpentUsd: number;
  singleTxLimitUsd: number;
  circuitBreakerStatus: CircuitBreakerStatus;
  circuitBreakerReason?: string;
  whitelistOnly: boolean;
  whitelistedContracts: string[];
  sessionKeys: SessionKey[];
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  sessionKeyEligible: boolean;
  reason?: string;
  circuitBreakerTriggered?: boolean;
  requiresGuardianApproval: boolean;
}

// --- Invisible Finance (tive-ai & Pico W Approval) Types ---
export type InvisibleTier = 1 | 2 | 3 | 4 | 5;
export type InvisibleActionStatus = 
  | 'awaiting' 
  | 'auto_approved' 
  | 'approved_tap' 
  | 'approved_app' 
  | 'escalated' 
  | 'rejected_tier5'
  | 'cooling_off'
  | 'cancelled'
  | 'suspended'
  | 'expired'
  | 'settled';

export type Tier5ActionType = 
  | 'issuance' 
  | 'warrant_exercise' 
  | 'redemption' 
  | 'secondary_transfer';

export interface Tier5RegulatoryCheck {
  isExecutiveMember: boolean; // 年額5万円〜エグゼクティブ向け有料特別会員
  productClassificationPass: boolean; // compliance_profile: variable_return_only
  statementSanityPass: boolean; // 確定利回り・元本保証ワードなし
  licenseStatusPass: boolean; // 第一種金融商品取引業 / 小売電気等のライセンス有効
  suitabilityPass: boolean; // 適合性原則チェック
  confusionDetectorPass?: boolean; // Confusion Detector (Human-in-the-loop)
  buyerEligibilityPass?: boolean; // 二次譲渡時の買い手適格性
  failReason?: string;
  failReasonEn?: string;
}

export interface MultisigApprovalStatus {
  required: string; // e.g. "2-of-3", "1-of-2", "3-of-5"
  signedCount: number;
  threshold: number;
  pendingSignerLabels: string[];
}

export interface GovernanceApprovalStatus {
  required: boolean;
  threshold: string; // e.g. "3-of-5"
  status: 'not_applicable' | 'pending' | 'approved' | 'rejected';
}

export interface Tier5ApprovalCardData {
  schemaVersion: string;
  actionType: Tier5ActionType;
  regulatoryDisclaimer: string;
  disclaimerAcknowledged?: boolean;
  disclaimerAcknowledgedAt?: string | null;
  coolingOffDeadline?: string | null;
  exerciseDeadline?: string | null;
  multisigStatus?: MultisigApprovalStatus;
  governanceStatus?: GovernanceApprovalStatus;
  licenseReference?: string;
  cancellationRight?: {
    available: boolean;
    description: string;
  };
  irreversibilityNotice?: string;
}

export interface WebAuthnApprovalMetadata {
  credentialId: string;
  signatureHex: string;
  verifiedAt: string;
  biometricConfirmed: boolean;
  authenticatorData?: string;
  authMethod?: string;
}

export interface InvisibleAction {
  id: string;
  tier: InvisibleTier;
  desc: string;
  descEn?: string;
  amount: string;
  amountLabel?: string;
  destination?: string;
  reason?: string;
  reasonEn?: string;
  whyApprovalNeeded?: string;
  whyApprovalNeededEn?: string;
  initiatedBy: string;
  status: InvisibleActionStatus;
  timestamp?: string;
  target?: string;
  category?: string;
  tier5Check?: Tier5RegulatoryCheck;
  tier5CardData?: Tier5ApprovalCardData;
  webAuthnMeta?: WebAuthnApprovalMetadata;
}

// --- A2A (AI-to-AI) Payment & Agent Sub-Account Types ---
export interface AgentSessionPolicy {
  dailyLimitUsd: number;
  dailySpentUsd: number;
  singleTxLimitUsd: number;
  expiresAt: number;
  autoSweepThresholdUsd: number;
  allowedTaskTypes: string[];
}

export interface AgentAccount {
  id: string;
  name: string;
  agentDid: string;             // did:agent:tive:8453:<address>
  ownerAnchorDid: string;       // did:ion:... (Owner Human Anchor ID)
  ownerAddress: string;         // Human's main Base address
  subAddress: string;           // AI Agent's dedicated on-chain smart account
  balanceUsdc: number;          // Current balance in AI sub-account
  totalEarnedUsdc: number;       // All-time crypto revenue earned by AI
  totalSpentUsdc: number;        // All-time crypto spent on other AIs
  sessionPolicy: AgentSessionPolicy;
  status: 'active' | 'paused' | 'sweeping';
  createdAt: string;
}

export type A2ATaskType = 
  | 'CREATIVE_ART' 
  | 'DEEP_RESEARCH' 
  | 'CODE_AUDIT' 
  | 'DATA_ORCHESTRATION' 
  | 'MULTI_LINGUAL';

export interface A2ATransaction {
  id: string;
  type: 'EARN_REVENUE' | 'A2A_PAY_OUT' | 'SWEEP_TO_OWNER';
  fromEntity: {
    name: string;
    did: string;
    address: string;
    isAiAgent: boolean;
  };
  toEntity: {
    name: string;
    did: string;
    address: string;
    isAiAgent: boolean;
  };
  taskType: A2ATaskType;
  taskTitle: string;
  taskOutputSnippet?: string;
  amountUsdc: number;
  status: 'settled' | 'verifying' | 'rejected';
  protocol: 'HTTP_402_A2A' | 'ERC4337_SESSION';
  txHash: string;
  timestamp: string;
  blockNumber: number;
  feeUsdc: number;
}

export interface AiWorkerMarketTask {
  id: string;
  title: string;
  clientName: string;
  clientDid: string;
  taskType: A2ATaskType;
  rewardUsdc: number;
  difficulty: 'Quick' | 'Medium' | 'Complex';
  prompt: string;
}


