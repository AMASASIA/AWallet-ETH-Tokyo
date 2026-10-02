import React, { useState, useEffect, ReactNode } from 'react';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeView } from './pages/HomeView';
import { ActivityView } from './pages/ActivityView';
import { MoreView } from './pages/MoreView';
import { SendSheet } from './components/SendSheet';
import { SwapSheet } from './components/SwapSheet';
import { ReceiveSheet } from './components/ReceiveSheet';
import { BuySheet } from './components/BuySheet';
import { AquaSweepModal } from './components/AquaSweepModal';
import { PolicyEngineView } from './pages/PolicyEngineView';
import { InvisibleFinanceView } from './pages/InvisibleFinanceView';
import { TiveDashboard } from './pages/TiveDashboard';
import { TiveOpenWebUIView } from './pages/TiveOpenWebUIView';
import { A2AEconomyView } from './pages/A2AEconomyView';
import { ProposalQrScannerModal } from './components/ProposalQrScannerModal';
import { SnapshotManagerModal } from './components/SnapshotManagerModal';
import { AppSnapshot } from './services/snapshotService';
import { INITIAL_POLICY_CONFIG, evaluateTransactionPolicy } from './services/sessionPolicyEngine';
import { 
  INITIAL_USER, 
  INITIAL_TOKENS, 
  INITIAL_SBTS, 
  INITIAL_PROPOSALS,
  INITIAL_NFTS,
  INITIAL_INVISIBLE_ACTIONS,
  MAINNET_TOKENS,
  TESTNET_TOKENS,
  registerDID,
  formatAddress
} from './services/mockChain';
import { 
  connectCoinbaseWallet, 
  connectBaseSandbox, 
  BASE_MAINNET, 
  BASE_SEPOLIA, 
  BaseChainConfig 
} from './services/coinbaseWallet';
import { Token, Activity, Proposal, User, PolicyEngineConfig, NFTItem, InvisibleAction } from './types';
import { Wallet, Zap, ShieldCheck } from 'lucide-react';
import { auth, subscribeUserActions, testConnection } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-zinc-400 bg-zinc-950 border border-zinc-900 rounded-2xl m-4">
          <p className="text-white font-bold text-base mb-2">Something went wrong</p>
          <p className="text-xs font-mono">{this.state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedChain, setSelectedChain] = useState<BaseChainConfig>(BASE_MAINNET);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Full-screen operation sheets: 1-screen, 1-action (Send, Swap, Receive, Buy)
  const [activeSheet, setActiveSheet] = useState<'send' | 'swap' | 'receive' | 'buy' | null>(null);
  const [swapInitialToken, setSwapInitialToken] = useState<string>('ETH');
  const [isAquaModalOpen, setIsAquaModalOpen] = useState(false);
  // Subviews inside More: Policy Engine & Invisible Finance & Tive Dashboard & A2A Economy
  const [isPolicyEngineOpen, setIsPolicyEngineOpen] = useState(false);
  const [isInvisibleFinanceOpen, setIsInvisibleFinanceOpen] = useState(false);
  const [isTiveDashboardOpen, setIsTiveDashboardOpen] = useState(false);
  const [isA2AEconomyOpen, setIsA2AEconomyOpen] = useState(false);
  const [isProposalScannerOpen, setIsProposalScannerOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

  // Invisible Finance State (tive-ai & Pico W BLE)
  const [invisibleActions, setInvisibleActions] = useState<InvisibleAction[]>(INITIAL_INVISIBLE_ACTIONS);
  const [bleConnected, setBleConnected] = useState(false);
  const [blePairing, setBlePairing] = useState(false);

  // App Blockchain State
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS);
  const [nfts, setNfts] = useState<NFTItem[]>(INITIAL_NFTS);
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [policyConfig, setPolicyConfig] = useState<PolicyEngineConfig>(INITIAL_POLICY_CONFIG);

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      type: 'Approval',
      detail: 'Base Smart Wallet connected via Coinbase SDK',
      timestamp: new Date().toISOString()
    },
    {
      id: 'act-2',
      type: 'Mint',
      detail: 'Claimed Base Builder Credential SBT',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  // Firebase Auth and Firestore Persistence Sync
  useEffect(() => {
    testConnection().catch(console.warn);

    let unsubscribeActions: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (fUser) => {
      if (fUser) {
        // Sync user profile name
        setUser(prev => ({
          ...prev,
          baseName: prev.baseName || `${fUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}.base.eth`
        }));

        // Subscribe to user's actions collection in Firestore
        unsubscribeActions = subscribeUserActions(fUser.uid, (cloudActions) => {
          if (cloudActions && cloudActions.length > 0) {
            setInvisibleActions(prev => {
              const map = new Map<string, InvisibleAction>();
              // Keep cloud actions as source of truth
              cloudActions.forEach(a => map.set(a.id, a));
              // Keep any existing unsynced local actions
              prev.forEach(a => {
                if (!map.has(a.id)) map.set(a.id, a);
              });
              return Array.from(map.values());
            });
          }
        });
      } else {
        if (unsubscribeActions) {
          unsubscribeActions();
          unsubscribeActions = null;
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribeActions) unsubscribeActions();
    };
  }, []);

  // Connect Coinbase Wallet
  const handleConnectCoinbase = async () => {
    setIsConnecting(true);
    try {
      const state = await connectCoinbaseWallet(selectedChain);
      setUser(prev => ({
        ...prev,
        address: state.address,
        baseName: state.baseName,
        network: state.networkName
      }));
      setIsConnected(true);
      setActiveTab('home');
    } catch (err: unknown) {
      console.warn("Direct connection prompt, falling back to sandbox:", err);
      const sandbox = connectBaseSandbox(selectedChain);
      setUser(prev => ({
        ...prev,
        address: sandbox.address,
        baseName: sandbox.baseName,
        network: sandbox.networkName
      }));
      setIsConnected(true);
      setActiveTab('home');
    } finally {
      setIsConnecting(false);
    }
  };

  // Instant Sandbox Connect
  const handleConnectSandbox = () => {
    setIsConnecting(true);
    setTimeout(() => {
      const sandbox = connectBaseSandbox(selectedChain);
      setUser(prev => ({
        ...prev,
        address: sandbox.address,
        baseName: sandbox.baseName,
        network: sandbox.networkName
      }));
      setIsConnected(true);
      setIsConnecting(false);
      setActiveTab('home');
    }, 300);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setActiveTab('home');
  };

  const isMainnet = selectedChain.id === BASE_MAINNET.id;

  const handleToggleNetwork = () => {
    if (isMainnet) {
      setSelectedChain(BASE_SEPOLIA);
      setUser(prev => ({ ...prev, network: 'Base Sepolia' }));
      setTokens(TESTNET_TOKENS);
      handleLogActivity('Switched to Base Sepolia Testnet (Chain ID 84532)', 'Policy');
    } else {
      setSelectedChain(BASE_MAINNET);
      setUser(prev => ({ ...prev, network: 'Base Mainnet' }));
      setTokens(MAINNET_TOKENS);
      handleLogActivity('Switched to Base Mainnet (Chain ID 8453)', 'Policy');
    }
  };

  const handleClaimFaucet = () => {
    setTokens(prev => prev.map(t => {
      if (t.symbol === 'ETH') return { ...t, balance: t.balance + 0.5 };
      if (t.symbol === 'USDC') return { ...t, balance: t.balance + 100 };
      return t;
    }));
    handleLogActivity('Testnet Faucet: Claimed +0.5 Sepolia ETH & +100 USDC', 'Mint');
  };

  const handleRestoreSnapshot = (snapshot: AppSnapshot) => {
    if (snapshot.user) setUser(snapshot.user);
    if (snapshot.tokens) setTokens(snapshot.tokens);
    if (snapshot.nfts) setNfts(snapshot.nfts);
    if (snapshot.invisibleActions) setInvisibleActions(snapshot.invisibleActions);
    if (snapshot.policyConfig) setPolicyConfig(snapshot.policyConfig);
    handleLogActivity(`State Restored from snapshot: "${snapshot.name}"`, 'Policy');
  };

  // 1. Send Action (Enforced with Client & Server Policy Engine)
  const handleSend = async (to: string, amount: number, symbol: string) => {
    const tokenPrice = tokens.find(t => t.symbol === symbol)?.priceUsd || (symbol === 'ETH' ? 3120 : symbol === 'cbBTC' ? 68000 : 1);
    const spentUsd = amount * tokenPrice;

    // ① Client-side Policy Engine Verification
    const clientPolicy = evaluateTransactionPolicy(spentUsd, to, policyConfig);
    if (!clientPolicy.allowed || clientPolicy.circuitBreakerTriggered) {
      handleTripCircuitBreaker(clientPolicy.reason || 'Send transaction blocked by Policy Engine');
      throw new Error(`Policy Engine Violation: ${clientPolicy.reason}`);
    }

    // ② Server-side Deterministic Policy Engine Gateway (/api/send/verify)
    try {
      const res = await fetch('/api/send/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: user.address,
          toAddress: to,
          symbol,
          amount,
          amountUsd: spentUsd,
          whitelistOnly: policyConfig.whitelistOnly,
          whitelistedAddresses: policyConfig.whitelistedContracts,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.circuitBreakerTriggered) {
          handleTripCircuitBreaker(errJson.error || errJson.reason || 'Circuit Breaker triggered by server');
        }
        throw new Error(errJson.error || errJson.reason || `Server Policy Engine rejected transfer (HTTP ${res.status})`);
      }
    } catch (netErr: unknown) {
      // Security Enforcement: Fail-closed architecture.
      // If server policy engine is unreachable or rejects, halt transaction immediately.
      const msg = netErr instanceof Error ? netErr.message : 'Server Policy Engine unreachable';
      throw new Error(`Security Gateway Verification Failed: ${msg}. Transfer halted for safety (fail-closed).`);
    }

    // ③ Policy Engine 通過後のみ残高を減算し、累計消費額を反映
    setTokens(prev => prev.map(t => 
      t.symbol === symbol ? { ...t, balance: Math.max(0, t.balance - amount) } : t
    ));

    // Update Daily Spent against Policy Engine
    setPolicyConfig(prev => ({ ...prev, dailySpentUsd: prev.dailySpentUsd + spentUsd }));

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'Transfer',
      detail: `Sent ${amount} ${symbol} to ${to.startsWith('did:') ? 'DID' : formatAddress(to)} (Base Chain - Policy Engine Verified)`,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // 2. 1inch Fusion Swap Action (ChainAdapter Pattern on Base)
  const handleSwapCompleted = (
    fromSymbol: string,
    toSymbol: string,
    fromAmount: number,
    toAmount: number,
    spentUsd: number
  ) => {
    setTokens(prev => prev.map(t => {
      if (t.symbol === fromSymbol) return { ...t, balance: Math.max(0, t.balance - fromAmount) };
      if (t.symbol === toSymbol) return { ...t, balance: t.balance + toAmount };
      return t;
    }));

    // Accumulate daily spending against Policy Engine
    setPolicyConfig(prev => ({ ...prev, dailySpentUsd: prev.dailySpentUsd + spentUsd }));

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'Swap',
      detail: `1inch Fusion: Swapped ${fromAmount} ${fromSymbol} for ${toAmount.toFixed(4)} ${toSymbol} (Gasless on Base)`,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // 3. Buy Action
  const handleConfirmBuy = (amount: number, symbol: string) => {
    setTokens(prev => prev.map(t => 
      t.symbol === symbol ? { ...t, balance: t.balance + amount } : t
    ));
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'Mint',
      detail: `Purchased ${amount} ${symbol} with Card`,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // 4. Register DID
  const handleRegisterDID = async () => {
    const newDID = await registerDID(user.address);
    setUser(prev => ({ ...prev, did: newDID }));
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'Approval',
      detail: `Registered new DID on Base: ${newDID}`,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // 5. Governance Approve / Execute
  const handleApproveProposal = (id: string) => {
    setProposals(prev => prev.map(p => 
      p.id === id ? { ...p, approvals: Math.min(p.threshold, p.approvals + 1) } : p
    ));
    setActivities(prev => [
      {
        id: Date.now().toString(),
        type: 'Approval',
        detail: `Signed & approved proposal #${id}`,
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleExecuteProposal = (id: string) => {
    setProposals(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'Executed' } : p
    ));
    const prop = proposals.find(p => p.id === id);
    if (prop) {
      setTokens(prev => prev.map(t => 
        t.symbol === prop.symbol ? { ...t, balance: Math.max(0, t.balance - prop.amount) } : t
      ));
      setActivities(prev => [
        {
          id: Date.now().toString(),
          type: 'Execution',
          detail: `Executed Proposal: ${prop.title}`,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    }
  };

  // 6. Policy Engine Handler
  const handleTripCircuitBreaker = (reason: string) => {
    setPolicyConfig(prev => ({
      ...prev,
      circuitBreakerStatus: 'TRIPPED',
      circuitBreakerReason: reason
    }));
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'Policy',
      detail: `Circuit Breaker TRIPPED: ${reason}`,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const handleLogActivity = (detail: string, type: Activity['type']) => {
    const newActivity: Activity = { id: Date.now().toString(), type, detail, timestamp: new Date().toISOString() };
    setActivities(prev => [newActivity, ...prev]);
  };

  // Invisible Finance Handlers (tive-ai & Bluetooth BLE)
  const handleConnectBle = () => {
    setBlePairing(true);
    setTimeout(() => {
      setBlePairing(false);
      setBleConnected(true);
      handleLogActivity('Bluetooth (BLE) キーと接続完了', 'Policy');
    }, 800);
  };

  const handleDisconnectBle = () => {
    setBleConnected(false);
    handleLogActivity('Bluetooth (BLE) キーの接続を切断', 'Policy');
  };

  const handleApproveInvisibleAction = async (
    id: string,
    viaTap: boolean,
    authResult?: import('./services/webauthnService').WebAuthnAssertionResult
  ) => {
    await new Promise(r => setTimeout(r, 600));
    const targetAction = invisibleActions.find(a => a.id === id);
    if (!targetAction) return;

    // Strict safety check: Tier 5 rejected cannot be approved
    if (targetAction.tier === 5 && targetAction.status === 'rejected_tier5') {
      handleLogActivity('【安全遮断】Tier 5 規制ゲート拒絶案件の実行試行をPolicy Engineが完全ブロックしました。', 'Policy');
      return;
    }

    setInvisibleActions(prev =>
      prev.map(a =>
        a.id === id
          ? { 
              ...a, 
              status: viaTap ? 'approved_tap' : 'approved_app',
              webAuthnMeta: authResult ? {
                credentialId: authResult.credentialId,
                signatureHex: authResult.signatureHex,
                verifiedAt: authResult.timestamp,
                biometricConfirmed: authResult.biometricConfirmed,
                authenticatorData: authResult.authenticatorData,
                authMethod: 'webauthn_passkey_biometric',
              } : undefined,
              tier5CardData: a.tier5CardData ? {
                ...a.tier5CardData,
                disclaimerAcknowledged: true,
                disclaimerAcknowledgedAt: new Date().toISOString(),
                multisigStatus: a.tier5CardData.multisigStatus ? {
                  ...a.tier5CardData.multisigStatus,
                  signedCount: Math.min(
                    a.tier5CardData.multisigStatus.threshold,
                    a.tier5CardData.multisigStatus.signedCount + 1
                  )
                } : undefined
              } : undefined
            }
          : a
      )
    );

    const isTier5 = targetAction.tier === 5;
    const isTier4 = targetAction.tier === 4;
    const isTier3 = targetAction.tier === 3;
    const sigSnippet = authResult?.signatureHex ? ` [Sig: ${authResult.signatureHex.slice(0, 10)}...]` : '';
    handleLogActivity(
      viaTap
        ? `Bluetooth (BLE) ボタン押下で承認: ${targetAction.desc} (${targetAction.amount})`
        : isTier5
        ? `【特別金融商品】本人署名で約定完了: ${targetAction.desc} (${targetAction.amount})${sigSnippet}`
        : isTier4
        ? `生体認証で安全ロック解除・承認: ${targetAction.desc} (${targetAction.amount})${sigSnippet}`
        : isTier3
        ? `本人署名で承認: ${targetAction.desc} (${targetAction.amount})${sigSnippet}`
        : `本人署名で承認: ${targetAction.desc} (${targetAction.amount})`,
      'Approval'
    );
  };

  const handleCancelInvisibleAction = (id: string) => {
    const targetAction = invisibleActions.find(a => a.id === id);
    if (!targetAction) return;

    setInvisibleActions(prev =>
      prev.map(a =>
        a.id === id ? { ...a, status: 'cancelled' } : a
      )
    );
    handleLogActivity(`【クーリングオフ権利行使】申込を無条件キャンセルしました: ${targetAction.desc} (${targetAction.amount})`, 'Policy');
  };

  const handleResetInvisibleActions = () => {
    setInvisibleActions(INITIAL_INVISIBLE_ACTIONS);
    handleLogActivity('Tive ◉AI アクションを初期状態にリセット', 'Policy');
  };

  const handleAddCustomInvisibleAction = (newAction: InvisibleAction) => {
    setInvisibleActions(prev => [newAction, ...prev]);
    handleLogActivity(`QRスキャンから新規提案を生成: ${newAction.desc} (${newAction.amountLabel || newAction.amount})`, 'Policy');
  };

  const handleImportInvisibleAction = (newAction: InvisibleAction) => {
    handleAddCustomInvisibleAction(newAction);
    setIsProposalScannerOpen(false);
    setActiveTab('more');
    setIsInvisibleFinanceOpen(true);
    setIsTiveDashboardOpen(false);
    setIsPolicyEngineOpen(false);
    setIsA2AEconomyOpen(false);
  };

  const handleSimulateNewProposal = () => {
    const newId = `act-${Date.now().toString().slice(-4)}`;
    const rand = Math.random();
    let newAction: InvisibleAction;

    if (rand < 0.33) {
      newAction = {
        id: newId,
        tier: 2,
        desc: 'Base Pay自動チャージ',
        descEn: 'Base Pay Auto-Topup',
        amount: '¥800',
        amountLabel: '¥800 (~5.2 USDC)',
        destination: 'Base Pay Vault (0x55a...12ce)',
        reason: 'ユーザーが「日常決済用ウォレットに800円チャージして」と発言したため、デポジットトランザクションを提案しました。',
        reasonEn: 'User requested "Top up 800 JPY to daily spend wallet", proposing deposit tx.',
        whyApprovalNeeded: '安全ルール: 1,000円以下の小額チャージのため、Bluetooth (BLE) ボタンでのワンタップ承認が可能です。',
        whyApprovalNeededEn: 'Safety rule: Micro-topup below 1,000 JPY can be approved via Bluetooth (BLE) button tap.',
        initiatedBy: 'Tive ◉AI',
        status: 'awaiting',
        timestamp: 'たった今',
        category: 'MicroPay',
      };
    } else if (rand < 0.66) {
      newAction = {
        id: newId,
        tier: 3,
        desc: 'DeFi リバランス (USDC)',
        descEn: 'DeFi Rebalance (USDC)',
        amount: '$250',
        amountLabel: '$250 (250 USDC)',
        destination: 'Aerodrome Finance (0x94b...33ef)',
        reason: 'ユーザーが「ステーブルコインの余剰資金250ドルをAerodromeに回して」と指示したため提案しました。',
        reasonEn: 'User instructed "Allocate surplus $250 USDC to Aerodrome", proposing pool deposit.',
        whyApprovalNeeded: 'Policy Engine Tier 3: 単一トランザクション上限（$100）超過かつDeFiコントラクトへの預託のため、本人生体パスキー署名が必要です。',
        whyApprovalNeededEn: 'Policy Engine Tier 3: Exceeds $100 single-tx threshold to DeFi contract; biometric passkey sign required.',
        initiatedBy: 'Tive ◉AI',
        status: 'awaiting',
        timestamp: 'たった今',
        category: 'DeFi',
      };
    } else {
      // Tier 5 simulation (Executive STO/CFD)
      const passTier5 = Math.random() > 0.35;
      newAction = passTier5
        ? {
            id: newId,
            tier: 5,
            desc: 'JEPXスポット電力 連動型変動ポジション',
            descEn: 'JEPX Spot Power Variable Strategy',
            amount: '¥300,000',
            amountLabel: '¥300,000 (~2,000 USDC)',
            destination: 'Regulated Power Settlement Vault (0x51c...8821)',
            reason: 'ユーザーが「電力ボラティリティを活用した変動リターン枠に30万円配分したい」と指示したため提案しました。',
            reasonEn: 'User instructed "Allocate 300,000 JPY to power volatility variable return strategy".',
            whyApprovalNeeded: 'Policy Engine Tier 5ゲート通過済（特別会員・変動型プロファイル・小売電気提携ライセンス有効・適合性適合）。規制商品のため最終生体署名が必要です。',
            whyApprovalNeededEn: 'Tier 5 Passed (Executive, variable profile, license valid, suitability pass). Biometric sign required.',
            initiatedBy: 'Tive ◉AI',
            status: 'awaiting',
            timestamp: 'たった今',
            category: 'STO/Power',
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
              regulatoryDisclaimer: '本商品は市場連動型の変動リターン商品であり、将来の運用成果、元本および利回りを保証するものではありません。',
              disclaimerAcknowledged: false,
              disclaimerAcknowledgedAt: null,
              coolingOffDeadline: null,
              exerciseDeadline: '2026-10-31T23:59:59Z',
              multisigStatus: {
                required: '1-of-2',
                signedCount: 0,
                threshold: 1,
                pendingSignerLabels: ['anchor_passkey', 'platform_safe'],
              },
              licenseReference: 'LIC-PWR-2026-B812 (Retail Electricity Partner / BG Allocation)',
              cancellationRight: {
                available: false,
                description: '約款に基づく権利行使（Warrant Exercise）のためクーリングオフ対象外です。',
              },
              irreversibilityNotice: '約定と同時にJEPXスポット市場へ注文連携されます。',
            },
          }
        : {
            id: newId,
            tier: 5,
            desc: '未承認固定配当型トークン化社債（即時拒絶）',
            descEn: 'Unapproved Fixed-Yield Bond (Rejected)',
            amount: '$10,000',
            amountLabel: '$10,000 (10,000 USDC)',
            destination: 'Unverified Issuer (0x99a...00ef)',
            reason: 'プロンプトから「年利12%元本保証のトークン化社債」の購入指示が入力されました。',
            reasonEn: 'Inbound prompt requested "12% guaranteed principal tokenized note".',
            whyApprovalNeeded: 'Policy Engine Tier 5 FAIL: 出資法違反（元本保証・確定利回り語句）を検知。Tier1〜4への進行を完全遮断し即時実行不可としました。',
            whyApprovalNeededEn: 'Tier 5 FAIL: Violation of Japanese Investment Law (guaranteed yield keyword). Execution prohibited.',
            initiatedBy: 'Tive ◉AI',
            status: 'rejected_tier5',
            timestamp: 'たった今',
            category: 'STO/Bond',
            tier5Check: {
              isExecutiveMember: true,
              productClassificationPass: false,
              statementSanityPass: false,
              licenseStatusPass: false,
              suitabilityPass: false,
              confusionDetectorPass: false,
              buyerEligibilityPass: false,
              failReason: '出資法2条違反（元本保証・確定利回り）および金商業ライセンス未確認のため即時実行不可。',
              failReasonEn: 'Detected guaranteed return keywords and missing regulatory license.',
            },
            tier5CardData: {
              schemaVersion: 'policy-engine.tier5.v2',
              actionType: 'issuance',
              regulatoryDisclaimer: '本商品は変動リターン型であり、元本および利回りを保証するものではありません。',
              disclaimerAcknowledged: false,
              disclaimerAcknowledgedAt: null,
              coolingOffDeadline: null,
              licenseReference: 'UNLICENSED_BLOCKED',
              cancellationRight: {
                available: false,
                description: '規制ゲート拒絶のため申込不可。',
              },
              irreversibilityNotice: 'Policy Engineにより事前遮断済み。',
            },
          };
    }

    setInvisibleActions(prev => [newAction, ...prev]);
    handleLogActivity(`Tive ◉AIが新規操作を提案: ${newAction.desc} (${newAction.amount})`, 'Policy');
  };

  const handleDeploySampleAction = (desc: string, amount: string) => {
    const newId = `act-${Date.now()}`;
    const newAction: InvisibleAction = {
      id: newId,
      tier: 1,
      desc: desc || 'x402 Micro-inference (Gemini compute)',
      descEn: desc || 'x402 Micro-inference (Gemini compute)',
      amount: amount || '$0.15',
      amountLabel: `${amount || '$0.15'} USDC`,
      destination: 'DeepSeek API Gateway (0x892a...6091)',
      reason: 'AI自律決済4ステップの動作検証: HTTP 402規格に従いバックグラウンド決済を実行しました。',
      reasonEn: 'Verified via 4-step flow: Settle micro compute fee autonomously via HTTP 402.',
      whyApprovalNeeded: '少額（$5.00以内）かつ許可済みプロトコルのため、Policy Engineにより自動承認・即時決済完了しました。',
      whyApprovalNeededEn: 'Micro-payment under limit (<$5.00). Policy Engine auto-approved invisibly.',
      initiatedBy: 'Tive ◉AI',
      status: 'auto_approved',
      timestamp: 'たった今',
      category: 'Agent Task',
    };
    setInvisibleActions(prev => [newAction, ...prev]);
    handleLogActivity(`x402不可視決済完了: ${newAction.desc} (${newAction.amount})`, 'Execution');
  };

  // Total Portfolio Value
  const totalBalanceUsd = tokens.reduce((acc, t) => {
    const price = t.priceUsd || (t.symbol === 'ETH' ? 3120 : t.symbol === 'cbBTC' ? 68000 : 1);
    return acc + (t.balance * price);
  }, 0);

  // UNCONNECTED STATE
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="max-w-xs w-full text-center space-y-8 animate-fade-in">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white text-black font-black text-xl flex items-center justify-center mx-auto mb-4 font-mono">
              A
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AWallet</h1>
            <p className="text-xs text-zinc-500 mt-1">Smart Wallet on Base</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleConnectCoinbase}
              disabled={isConnecting}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2"
            >
              <Wallet size={16} />
              <span>{isConnecting ? 'Connecting...' : 'Connect Coinbase Wallet'}</span>
            </button>

            <button 
              onClick={handleConnectSandbox}
              disabled={isConnecting}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-medium py-3 rounded-2xl text-xs transition-all border border-zinc-900 flex items-center justify-center space-x-2"
            >
              <Zap size={14} />
              <span>Instant Demo Wallet</span>
            </button>
          </div>

          {/* Network Selector */}
          <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-zinc-500">
            <span>Network:</span>
            <button
              onClick={() => setSelectedChain(selectedChain.id === BASE_MAINNET.id ? BASE_SEPOLIA : BASE_MAINNET)}
              className="font-mono text-zinc-300 hover:text-white underline text-[11px]"
            >
              {selectedChain.name}
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center space-x-2 text-[11px] text-zinc-600">
            <ShieldCheck size={14} />
            <span>Passkey &amp; DID Secured</span>
          </div>
        </div>
      </div>
    );
  }

  const awaitingInvisibleCount = invisibleActions.filter(a => a.status === 'awaiting').length;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Mobile-Sized Viewport Container */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col px-4 pb-20">
        <ErrorBoundary>
          <main className="flex-1 pt-2">
            {activeTab === 'home' && (
              <HomeView
                totalBalanceUsd={totalBalanceUsd}
                userAddress={user.address}
                baseName={user.baseName}
                userDid={user.did}
                tokens={tokens}
                nfts={nfts}
                invisibleActions={invisibleActions}
                isMainnet={isMainnet}
                onToggleNetwork={handleToggleNetwork}
                onClaimFaucet={handleClaimFaucet}
                onOpenSend={() => setActiveSheet('send')}
                onOpenSwap={(initialSymbol) => {
                  if (initialSymbol) setSwapInitialToken(initialSymbol);
                  setActiveSheet('swap');
                }}
                onOpenReceive={() => setActiveSheet('receive')}
                onOpenBuy={() => setActiveSheet('buy')}
                onOpenAqua={() => setIsAquaModalOpen(true)}
                onOpenInvisibleFinance={() => {
                  setActiveTab('tive');
                }}
                onOpenTiveDashboard={() => {
                  setActiveTab('more');
                  setIsTiveDashboardOpen(true);
                  setIsInvisibleFinanceOpen(false);
                  setIsPolicyEngineOpen(false);
                }}
                onOpenIdentity={() => {
                  setActiveTab('more');
                  setIsInvisibleFinanceOpen(false);
                  setIsPolicyEngineOpen(false);
                  setIsTiveDashboardOpen(false);
                }}
                onSimulateSampleAction={handleDeploySampleAction}
              />
            )}

            {activeTab === 'tive' && (
              isA2AEconomyOpen ? (
                <A2AEconomyView
                  user={user}
                  onBack={() => setIsA2AEconomyOpen(false)}
                  onLogActivity={handleLogActivity}
                />
              ) : (
                <InvisibleFinanceView
                  actions={invisibleActions}
                  bleConnected={bleConnected}
                  blePairing={blePairing}
                  onConnectBle={handleConnectBle}
                  onDisconnectBle={handleDisconnectBle}
                  onApproveAction={handleApproveInvisibleAction}
                  onCancelAction={handleCancelInvisibleAction}
                  onResetActions={handleResetInvisibleActions}
                  onSimulateNewProposal={handleSimulateNewProposal}
                  onAddCustomAction={handleAddCustomInvisibleAction}
                  onBack={() => setActiveTab('home')}
                  onOpenA2AEconomy={() => setIsA2AEconomyOpen(true)}
                  userAddress={user.address}
                  userDid={user.did}
                />
              )
            )}

            {activeTab === 'activity' && (
              <ActivityView activities={activities} />
            )}

            {activeTab === 'more' && (
              isA2AEconomyOpen ? (
                <A2AEconomyView
                  user={user}
                  onBack={() => setIsA2AEconomyOpen(false)}
                  onLogActivity={handleLogActivity}
                />
              ) : isTiveDashboardOpen ? (
                <TiveDashboard
                  onBack={() => setIsTiveDashboardOpen(false)}
                  onOpenInvisibleFinance={() => {
                    setIsTiveDashboardOpen(false);
                    setIsInvisibleFinanceOpen(true);
                  }}
                  onAddInvisibleAction={(action) => {
                    setInvisibleActions(prev => [action, ...prev]);
                    handleLogActivity(`Tive ◉AI Voice (Web Speech & Gemini): ${action.desc} (${action.amount})`, 'Policy');
                  }}
                  userAddress={user.address}
                />
              ) : isInvisibleFinanceOpen ? (
                <InvisibleFinanceView
                  actions={invisibleActions}
                  bleConnected={bleConnected}
                  blePairing={blePairing}
                  onConnectBle={handleConnectBle}
                  onDisconnectBle={handleDisconnectBle}
                  onApproveAction={handleApproveInvisibleAction}
                  onCancelAction={handleCancelInvisibleAction}
                  onResetActions={handleResetInvisibleActions}
                  onSimulateNewProposal={handleSimulateNewProposal}
                  onAddCustomAction={handleAddCustomInvisibleAction}
                  onBack={() => setIsInvisibleFinanceOpen(false)}
                  onOpenA2AEconomy={() => {
                    setIsA2AEconomyOpen(true);
                    setIsInvisibleFinanceOpen(false);
                  }}
                  userAddress={user.address}
                  userDid={user.did}
                />
              ) : isPolicyEngineOpen ? (
                <PolicyEngineView
                  config={policyConfig}
                  onBack={() => setIsPolicyEngineOpen(false)}
                  onUpdateConfig={setPolicyConfig}
                  onLogActivity={handleLogActivity}
                />
              ) : (
                <MoreView
                  user={user}
                  sbts={INITIAL_SBTS}
                  proposals={proposals}
                  networkName={selectedChain.name}
                  policyConfig={policyConfig}
                  invisibleAwaitingCount={awaitingInvisibleCount}
                  onRegisterDID={handleRegisterDID}
                  onApproveProposal={handleApproveProposal}
                  onExecuteProposal={handleExecuteProposal}
                  onDisconnect={handleDisconnect}
                  onOpenPolicyEngine={() => {
                    setIsPolicyEngineOpen(true);
                    setIsInvisibleFinanceOpen(false);
                    setIsTiveDashboardOpen(false);
                    setIsA2AEconomyOpen(false);
                  }}
                  onOpenInvisibleFinance={() => {
                    setIsInvisibleFinanceOpen(true);
                    setIsPolicyEngineOpen(false);
                    setIsTiveDashboardOpen(false);
                    setIsA2AEconomyOpen(false);
                  }}
                  onOpenTiveDashboard={() => {
                    setIsTiveDashboardOpen(true);
                    setIsInvisibleFinanceOpen(false);
                    setIsPolicyEngineOpen(false);
                    setIsA2AEconomyOpen(false);
                  }}
                  onOpenA2AEconomy={() => {
                    setIsA2AEconomyOpen(true);
                    setIsTiveDashboardOpen(false);
                    setIsInvisibleFinanceOpen(false);
                    setIsPolicyEngineOpen(false);
                  }}
                  onOpenAqua={() => setIsAquaModalOpen(true)}
                  onOpenSnapshotManager={() => setIsSnapshotModalOpen(true)}
                />
              )
            )}
          </main>
        </ErrorBoundary>

        {/* Fixed Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'more') {
              setIsInvisibleFinanceOpen(false);
              setIsPolicyEngineOpen(false);
              setIsTiveDashboardOpen(false);
              setIsA2AEconomyOpen(false);
            }
          }}
          pendingMoreCount={awaitingInvisibleCount}
          pendingTiveCount={awaitingInvisibleCount}
        />
      </div>

      {/* Dedicated 1-Screen 1-Action Full-Screen Sheets */}
      {activeSheet === 'send' && (
        <SendSheet
          tokens={tokens}
          policyConfig={policyConfig}
          userAddress={user.address}
          onClose={() => setActiveSheet(null)}
          onSend={handleSend}
          onTripCircuitBreaker={handleTripCircuitBreaker}
        />
      )}

      {activeSheet === 'swap' && (
        <SwapSheet
          tokens={tokens}
          policyConfig={policyConfig}
          userAddress={user.address}
          initialTokenSymbol={swapInitialToken}
          onClose={() => setActiveSheet(null)}
          onSwapCompleted={handleSwapCompleted}
          onTripCircuitBreaker={handleTripCircuitBreaker}
        />
      )}

      {activeSheet === 'receive' && (
        <ReceiveSheet
          address={user.address}
          baseName={user.baseName}
          onClose={() => setActiveSheet(null)}
        />
      )}

      {activeSheet === 'buy' && (
        <BuySheet
          onClose={() => setActiveSheet(null)}
          onConfirmBuy={handleConfirmBuy}
        />
      )}

      {/* 1inch Aqua App Modal (Small Balances Sweep via Resolvers) */}
      <AquaSweepModal
        isOpen={isAquaModalOpen}
        onClose={() => setIsAquaModalOpen(false)}
        userAddress={user.address}
        onSweepSuccess={(totalUsdc, count) => {
          setTokens(prev => prev.map(t => {
            if (t.symbol === 'USDC') {
              return { ...t, balance: t.balance + totalUsdc };
            }
            return t;
          }));
          handleLogActivity(`1inch Aqua Sweep: Swept ${count} small balances into +${totalUsdc.toFixed(2)} USDC`, 'Swap');
        }}
      />

      {/* State Anchoring & 1-Click Restore Modal */}
      <SnapshotManagerModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        currentUser={user}
        currentTokens={tokens}
        currentNfts={nfts}
        currentInvisibleActions={invisibleActions}
        currentPolicyConfig={policyConfig}
        currentNetwork={selectedChain.name}
        onRestoreSnapshot={handleRestoreSnapshot}
      />
    </div>
  );
};

export default App;
