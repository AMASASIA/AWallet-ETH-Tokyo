export type Locale = 'ja' | 'en';

export interface I18nDictionary {
  walletBack: string;
  headerTitle: string;
  tabSummary: string;
  tabMultiAsset: string;
  tabButterfly: string;
  tabAutoML: string;
  totalAssets: string;
  todayYield: string;
  targetApy: string;
  sentimentTitle: string;
  sentimentSubtitle: string;
  usdcAccount: string;
  usdcDesc: string;
  yieldAccount: string;
  yieldDesc: string;
  multiAssetCfdTitle: string;
  multiAssetCfdStatusPending: string;
  multiAssetCfdStatusDev: string;
  multiAssetCfdDesc: string;
  multiAssetCfdNotice: string;
  butterflyTitle: string;
  butterflyDesc: string;
  autoMlTitle: string;
  autoMlStatus: string;
  autoMlDesc: string;
  implementedBadge: string;
  pendingBadge: string;
  comingSoonBadge: string;
}

export const DICTIONARY: Record<Locale, I18nDictionary> = {
  ja: {
    walletBack: 'Wallet',
    headerTitle: 'AI Asset Management',
    tabSummary: 'Overview',
    tabMultiAsset: 'Multi-Asset',
    tabButterfly: 'Amane',
    tabAutoML: 'AutoML',
    totalAssets: 'Portfolio Balance',
    todayYield: '24h Change',
    targetApy: 'Estimated Yield',
    sentimentTitle: 'Market Sentiment',
    sentimentSubtitle: 'Volatility Index',
    usdcAccount: 'USDC Vault',
    usdcDesc: 'On-chain Balance',
    yieldAccount: 'Yield',
    yieldDesc: 'Amane Protocol',
    multiAssetCfdTitle: 'Multi-Asset CFD & Crypto (Planning)',
    multiAssetCfdStatusPending: 'Pending',
    multiAssetCfdStatusDev: 'Coming Soon',
    multiAssetCfdDesc: 'TradFi CFD（指数・コモディティ）および暗号資産取引所連携は仕様検討中（Pending）です。',
    multiAssetCfdNotice: '※ 実際の注文発注・資金移動は未接続です。公式API接続後に公開予定です。',
    butterflyTitle: 'Butterfly Effect Liaison',
    butterflyDesc: '無関係な事象を規則性・因果関係・影響力をもってつなぐAmane Protocol概念。',
    autoMlTitle: 'Butterfly Effect (tive_butterfly_effect.py)',
    autoMlStatus: 'Verified',
    autoMlDesc: '群知能(ABC)特徴選択×RF探索。サーキットブレーカー・入力検証・改ざん防止監査ログ(SHA-256)搭載。',
    implementedBadge: 'Active',
    pendingBadge: 'Pending',
    comingSoonBadge: 'Coming Soon',
  },
  en: {
    walletBack: 'Wallet',
    headerTitle: 'AI Asset Management',
    tabSummary: 'Overview',
    tabMultiAsset: 'Multi-Asset',
    tabButterfly: 'Amane',
    tabAutoML: 'AutoML',
    totalAssets: 'Portfolio Balance',
    todayYield: '24h Change',
    targetApy: 'Estimated Yield',
    sentimentTitle: 'Market Sentiment',
    sentimentSubtitle: 'Volatility Index',
    usdcAccount: 'USDC Vault',
    usdcDesc: 'On-chain Balance',
    yieldAccount: 'Yield',
    yieldDesc: 'Amane Protocol',
    multiAssetCfdTitle: 'Multi-Asset CFD & Crypto (Planning)',
    multiAssetCfdStatusPending: 'Pending',
    multiAssetCfdStatusDev: 'Coming Soon',
    multiAssetCfdDesc: 'TradFi CFD (Indices & Commodities) and crypto exchange integration is currently under specification (Pending).',
    multiAssetCfdNotice: 'Note: Live trading and fund transfers are not connected. Scheduled for future release.',
    butterflyTitle: 'Butterfly Effect Liaison',
    butterflyDesc: 'Amane Protocol Liaison model bridging disparate elements through causality and dynamic influence.',
    autoMlTitle: 'Butterfly Effect (tive_butterfly_effect.py)',
    autoMlStatus: 'Verified',
    autoMlDesc: 'ABC swarm intelligence feature selection & RF tuning with circuit breakers, input defense & tamper-evident audit logs.',
    implementedBadge: 'Active',
    pendingBadge: 'Pending',
    comingSoonBadge: 'Coming Soon',
  },
};
