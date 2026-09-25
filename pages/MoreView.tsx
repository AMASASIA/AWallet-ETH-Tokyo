import React, { useState } from 'react';
import { 
  Fingerprint, 
  Users, 
  ChevronRight, 
  LogOut, 
  ArrowLeft, 
  Copy, 
  Check, 
  Plus,
  ShieldAlert,
  Sparkles,
  Globe,
  Cpu,
  Wifi,
  Bluetooth
} from 'lucide-react';
import { User, SBT, Proposal, PolicyEngineConfig } from '../types';
import { formatAddress } from '../services/mockChain';
import { InteroperabilityGuideModal } from '../components/InteroperabilityGuideModal';
import { AWalletSimpleGuideModal, GuideTab } from '../components/AWalletSimpleGuideModal';

interface MoreViewProps {
  user: User;
  sbts: SBT[];
  proposals: Proposal[];
  networkName: string;
  policyConfig: PolicyEngineConfig;
  invisibleAwaitingCount?: number;
  onRegisterDID: () => Promise<void>;
  onApproveProposal: (id: string) => void;
  onExecuteProposal: (id: string) => void;
  onDisconnect: () => void;
  onOpenPolicyEngine: () => void;
  onOpenInvisibleFinance: () => void;
  onOpenTiveDashboard?: () => void;
  onOpenA2AEconomy?: () => void;
  onOpenAqua?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  user,
  sbts,
  proposals,
  networkName,
  policyConfig,
  invisibleAwaitingCount = 0,
  onRegisterDID,
  onApproveProposal,
  onExecuteProposal,
  onDisconnect,
  onOpenPolicyEngine,
  onOpenInvisibleFinance,
  onOpenTiveDashboard,
  onOpenA2AEconomy,
  onOpenAqua,
}) => {
  const [currentSubView, setCurrentSubView] = useState<'identity' | 'governance' | 'bundler_verify' | null>(null);
  const [showInteroperabilityGuide, setShowInteroperabilityGuide] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<GuideTab>('comparison');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedDid, setCopiedDid] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // 0DAO Verification & Bundler State
  const [verifyTxInput, setVerifyTxInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [bundlerSettings, setBundlerSettings] = useState<any>(null);
  const [customBundlerUrl, setCustomBundlerUrl] = useState('');
  const [saveBundlerSuccess, setSaveBundlerSuccess] = useState(false);
  const [bleWifiConnected, setBleWifiConnected] = useState<boolean>(true);

  const fetchBundlerSettings = async () => {
    try {
      const res = await fetch('/api/anchor/settings');
      const data = await res.json();
      if (data.anchor) {
        setBundlerSettings(data.anchor);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveBundler = async () => {
    try {
      const res = await fetch('/api/anchor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anchorId: user.address,
          bundlerRpcUrl: customBundlerUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveBundlerSuccess(true);
        setTimeout(() => setSaveBundlerSuccess(false), 3000);
        fetchBundlerSettings();
      }
    } catch {
      // ignore
    }
  };

  const handleVerifyTx = async (txHashToVerify?: string) => {
    const targetHash = txHashToVerify || verifyTxInput;
    if (!targetHash) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(targetHash)}`);
      const data = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyResult({
        status: 'error',
        message: err?.message || 'Verification request failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (text: string, type: 'addr' | 'did') => {
    navigator.clipboard.writeText(text);
    if (type === 'addr') {
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    } else {
      setCopiedDid(true);
      setTimeout(() => setCopiedDid(false), 2000);
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await onRegisterDID();
    } finally {
      setIsRegistering(false);
    }
  };

  // 1. NESTED IDENTITY VIEW
  if (currentSubView === 'identity') {
    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center justify-between px-1 h-12 border-b border-zinc-900">
          <button
            onClick={() => setCurrentSubView(null)}
            className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="font-semibold text-sm">Soul Identity (DID)</span>
          <div className="w-6" />
        </div>

        {/* User Card */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
          <div className="flex items-center space-x-3.5">
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-12 h-12 rounded-full grayscale border border-zinc-800"
            />
            <div>
              <h3 className="font-bold text-base text-white">{user.name}</h3>
              <p className="text-xs text-zinc-500 font-mono">{user.baseName || 'alex.base.eth'}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-900">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">DID Identifier</span>
              <button
                onClick={() => handleCopy(user.did, 'did')}
                className="flex items-center space-x-1 font-mono text-zinc-300 hover:text-white"
              >
                <span>{user.did.slice(0, 16)}...</span>
                {copiedDid ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Controller Address</span>
              <button
                onClick={() => handleCopy(user.address, 'addr')}
                className="flex items-center space-x-1 font-mono text-zinc-300 hover:text-white"
              >
                <span>{formatAddress(user.address)}</span>
                {copiedAddr ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* Register New DID */}
        <button
          onClick={handleRegister}
          disabled={isRegistering}
          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-zinc-800 transition-colors"
        >
          <Plus size={14} />
          <span>{isRegistering ? 'Generating ION Key...' : 'Rotate / Register DID'}</span>
        </button>

        {/* Soulbound Credentials List */}
        <div>
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Soulbound Credentials ({sbts.length})
          </h4>
          <div className="divide-y divide-zinc-900 border-y border-zinc-900">
            {sbts.map((sbt) => (
              <div key={sbt.id} className="py-3 px-1 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">{sbt.name}</p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {sbt.type} • {sbt.issueDate}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. NESTED GOVERNANCE VIEW
  if (currentSubView === 'governance') {
    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center justify-between px-1 h-12 border-b border-zinc-900">
          <button
            onClick={() => setCurrentSubView(null)}
            className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="font-semibold text-sm">Governance &amp; Safe</span>
          <div className="w-6" />
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Threshold Scheme</span>
            <span className="font-mono text-white font-semibold">2 of 3 Guardians</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Critical account mutations &amp; spending above policy caps require guardian approvals.
          </p>
        </div>

        {/* Proposals */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Active Proposals ({proposals.length})
          </h4>

          {proposals.map((prop) => {
            const isExecuted = prop.status === 'Executed';
            const canExecute = prop.approvals >= prop.threshold && !isExecuted;

            return (
              <div key={prop.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400">
                      #{prop.id} • {prop.status}
                    </span>
                    <h5 className="font-semibold text-sm text-white mt-1.5">{prop.title}</h5>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {prop.amount} {prop.symbol}
                  </span>
                </div>

                <p className="text-xs text-zinc-400">{prop.description}</p>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">
                    Signatures: {prop.approvals} / {prop.threshold}
                  </span>
                  <div className="w-24 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full"
                      style={{ width: `${(prop.approvals / prop.threshold) * 100}%` }}
                    />
                  </div>
                </div>

                {!isExecuted && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onApproveProposal(prop.id)}
                      disabled={prop.approvals >= prop.threshold}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold border border-zinc-800 transition-colors disabled:opacity-40"
                    >
                      Sign Approval
                    </button>
                    <button
                      onClick={() => onExecuteProposal(prop.id)}
                      disabled={!canExecute}
                      className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-bold transition-colors disabled:opacity-40"
                    >
                      Execute
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. BUNDLER & 0DAO VERIFICATION VIEW
  if (currentSubView === 'bundler_verify') {
    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center justify-between px-1 h-12 border-b border-zinc-900">
          <button
            onClick={() => setCurrentSubView(null)}
            className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="font-semibold text-sm">0DAO 検証 &amp; Bundler接続</span>
          <div className="w-6" />
        </div>

        {/* Status Overview Card */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-white">ERC-4337 Bundler / Paymaster</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Base Sepolia (84532)
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Pimlico BundlerおよびPaymasterと接続し、ガス代スポンサー付きのUserOperation自律実行と0DAO即時検証を提供します。
          </p>
        </div>

        {/* 0DAO On-Chain Verification Panel */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
              <span>🛡️ 0DAO オンチェーン検証パネル</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">/api/verify/:txHash</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            審査員向け検証ツール: Basescanを開かずに、Base Sepoliaノードから確定レシートを直接取得し&ldquo;live&rdquo;状態を証明します。
          </p>

          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x... トランザクションハッシュを入力"
                value={verifyTxInput}
                onChange={(e) => setVerifyTxInput(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={() => handleVerifyTx()}
                disabled={isVerifying || !verifyTxInput.trim()}
                className="px-4 py-2 rounded-xl bg-white disabled:bg-zinc-800 text-black disabled:text-zinc-500 font-bold text-xs transition-colors shrink-0"
              >
                {isVerifying ? '検証中...' : '検証実行'}
              </button>
            </div>

            {/* Quick Sample Hashes */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[10px] text-zinc-500">サンプル:</span>
              <button
                type="button"
                onClick={() => {
                  const sample = '0x8453b47c0a9b5b2e8102dce883f3ed872659dc01ab8872f09d18e38102fae801';
                  setVerifyTxInput(sample);
                  handleVerifyTx(sample);
                }}
                className="text-[10px] font-mono text-zinc-400 hover:text-white underline"
              >
                Bundler Tx (Base Sepolia)
              </button>
            </div>
          </div>

          {/* Verification Result Output */}
          {verifyResult && (
            <div className="mt-3 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs font-mono animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 ${
                    verifyResult.status === 'live'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : verifyResult.status === 'pending'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{verifyResult.status.toUpperCase()} (確定済み)</span>
                </span>
              </div>

              {verifyResult.blockNumber && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Block:</span>
                  <span className="text-white font-bold">#{verifyResult.blockNumber}</span>
                </div>
              )}

              {verifyResult.gasUsed && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Gas Used:</span>
                  <span className="text-zinc-300">{verifyResult.gasUsed}</span>
                </div>
              )}

              {verifyResult.confirmations && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Confirmations:</span>
                  <span className="text-emerald-400">{verifyResult.confirmations} blocks</span>
                </div>
              )}

              {verifyResult.explorerUrl && (
                <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500">Explorer:</span>
                  <a
                    href={verifyResult.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-300 hover:text-white underline truncate max-w-[200px]"
                  >
                    Basescan
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Anchor Pimlico Key & Settings Panel */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              🔑 Anchor Bundler 設定
            </h3>
            <button
              type="button"
              onClick={fetchBundlerSettings}
              className="text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              更新
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            .envへの秘密鍵直書きを回避し、Anchor ID単位でPimlico Bundler RPCやセッションキーをメモリ管理します。
          </p>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="https://api.pimlico.io/v2/84532/rpc?apikey=..."
              value={customBundlerUrl}
              onChange={(e) => setCustomBundlerUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={handleSaveBundler}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold border border-zinc-800 transition-colors"
            >
              {saveBundlerSuccess ? '✓ 設定を登録しました' : 'Anchor設定に登録'}
            </button>
          </div>

          {bundlerSettings && (
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1">
              <div>RPC: <span className="text-zinc-300">{bundlerSettings.bundlerRpcUrl}</span></div>
              <div>Paymaster: <span className="text-emerald-400">{bundlerSettings.hasPaymaster ? '有効' : '無効'}</span></div>
            </div>
          )}
        </div>

        {/* BLE / Wi-Fi Connection Card (Simple On/Off button) */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                bleWifiConnected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}
            >
              <Bluetooth size={16} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-white">BLE / Wi-Fi 接続</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    bleWifiConnected
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  {bleWifiConnected ? 'ON (接続中)' : 'OFF (未接続)'}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Pico W / 外部ハードウェアスイッチ同期
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBleWifiConnected((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              bleWifiConnected
                ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {bleWifiConnected ? '切断 (OFF)' : '接続 (ON)'}
          </button>
        </div>
      </div>
    );
  }

  // 4. MAIN MORE MENU
  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-white tracking-tight">More</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Settings, Policy, Identity &amp; Governance</p>
      </div>

      {/* Profile quick bar */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-[11px] text-zinc-500 font-mono">{formatAddress(user.address)}</p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
          {networkName}
        </span>
      </div>

      {/* Navigation List */}
      <div className="divide-y divide-zinc-900 border-y border-zinc-900">
        {/* AI Asset Management */}
        {onOpenTiveDashboard && (
          <button
            onClick={onOpenTiveDashboard}
            className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-emerald-400 text-black flex items-center justify-center text-[9px] font-bold select-none shadow">
                AI
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-white">AI Asset Management</p>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                    稼働中
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Vault · Policy Engine Tier Control
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </button>
        )}

        {/* Tive ◉AI Policy Approvals */}
        <button
          onClick={onOpenInvisibleFinance}
          className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold select-none shadow">
              ◉
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white">Tive ◉AI Approvals</p>
                {invisibleAwaitingCount > 0 ? (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white text-black font-semibold">
                    {invisibleAwaitingCount}件 承認待ち
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400">
                    待機中
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                AI proposals, Approval cards &amp; BLE Key
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
        </button>

        {/* A2A Economy & AI Agent Sub-Account */}
        {onOpenA2AEconomy && (
          <button
            onClick={onOpenA2AEconomy}
            className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center text-[10px] font-bold select-none shadow">
                <Cpu size={11} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-white">A2A Economy &amp; AI Account</p>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    AI専用口座
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Sub-account under Anchor ID &amp; A2A settlement
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </button>
        )}

        {/* 1inch Aqua App */}
        {onOpenAqua && (
          <button
            onClick={onOpenAqua}
            className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 flex items-center justify-center text-[10px] font-bold select-none shadow">
                1i
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-white">1inch Aqua App</p>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    18 coins · 残高集約
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Small balances sweep · Zero gas settlement via Resolvers
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </button>
        )}

        {/* Bundler & 0DAO On-Chain Verification Panel */}
        <button
          onClick={() => {
            setCurrentSubView('bundler_verify');
            fetchBundlerSettings();
          }}
          className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 flex items-center justify-center text-[10px] font-bold select-none shadow">
              ✓
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white">0DAO Verification &amp; Bundler</p>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  Base Sepolia
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                On-chain verification, Pimlico bundler &amp; BLE tap
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
        </button>

        {/* Policy Engine & Circuit Breaker */}
        <button
          onClick={onOpenPolicyEngine}
          className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <ShieldAlert size={18} className="text-zinc-400" />
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white">Policy Engine &amp; Spending Caps</p>
                {policyConfig.circuitBreakerStatus === 'TRIPPED' ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold">
                    停止中
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400">
                    安全保護
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Daily limit (${configSpent(policyConfig)} / ${policyConfig.dailySpendCapUsd}) &amp; security rules
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-600" />
        </button>

        {/* Identity & DID */}
        <button
          onClick={() => setCurrentSubView('identity')}
          className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Fingerprint size={18} className="text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-white">Soul Identity &amp; DID</p>
              <p className="text-xs text-zinc-500">Decentralized IDs &amp; Soulbound credentials</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-600" />
        </button>

        {/* Governance & Safe */}
        <button
          onClick={() => setCurrentSubView('governance')}
          className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Users size={18} className="text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-white">Governance &amp; MultiSig</p>
              <p className="text-xs text-zinc-500">Guardian threshold approvals &amp; execution</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-600" />
        </button>

        {/* Interoperability & Standards Guide */}
        <button
          onClick={() => setShowInteroperabilityGuide(true)}
          className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-zinc-950/60 transition-colors group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Globe size={18} className="text-zinc-400" />
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white">Interoperability &amp; Standards</p>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                  EIP-1193
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Coinbase Wallet &amp; dApp integration
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
        </button>
      </div>

      {/* Disconnect Action */}
      <div className="pt-4">
        <button
          onClick={onDisconnect}
          className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl border border-zinc-900 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-950 transition-colors"
        >
          <LogOut size={16} />
          <span>Disconnect Wallet</span>
        </button>
      </div>

      {/* Interoperability Guide Modal */}
      {showInteroperabilityGuide && (
        <InteroperabilityGuideModal onClose={() => setShowInteroperabilityGuide(false)} />
      )}
    </div>
  );
};

function configSpent(config: PolicyEngineConfig): string {
  return config.dailySpentUsd.toFixed(0);
}
