import React, { useState } from 'react';
import { 
  ArrowLeft, 
  X, 
  ShieldCheck, 
  Cpu, 
  Coins, 
  Zap, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  ExternalLink, 
  Lock, 
  Sparkles, 
  Flame,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';

export type GuideTab = 'steps4' | 'comparison' | 'rules3' | 'why';

interface AWalletSimpleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: GuideTab;
  userDid?: string;
  userAddress?: string;
  onDeploySampleAction?: (actionDesc: string, amount: string) => void;
}

export const AWalletSimpleGuideModal: React.FC<AWalletSimpleGuideModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'steps4',
  userDid = 'did:key:z6Mkq4G...base99',
  userAddress = '0x8453...59dC',
  onDeploySampleAction,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>(initialTab);
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const isJa = lang === 'ja';

  // Interactive 4-Step Simulator State
  const [step1Done, setStep1Done] = useState(true);
  const [step2Minting, setStep2Minting] = useState(false);
  const [step2Minted, setStep2Minted] = useState(true);
  const [budgetCap, setBudgetCap] = useState<'0.005' | '0.01' | '25'>('0.01');
  const [singleTxCap, setSingleTxCap] = useState<'1' | '5' | '10'>('5');
  const [budgetSaved, setBudgetSaved] = useState(true);
  const [step4Running, setStep4Running] = useState(false);
  const [step4Log, setStep4Log] = useState<string[]>([]);
  const [simulatedCount, setSimulatedCount] = useState(0);

  if (!isOpen) return null;

  // Handle Step 2: AtomicMint execution simulation
  const handleRunAtomicMint = () => {
    setStep2Minting(true);
    setTimeout(() => {
      setStep2Minting(false);
      setStep2Minted(true);
    }, 900);
  };

  // Handle Step 4: Run invisible x402 settlement simulation
  const handleRunDeployAndSettle = () => {
    setStep4Running(true);
    setStep4Log([
      isJa ? '1. AIエージェントが推論タスクを実行中 (HTTP GET /api/v1/inference)...' : '1. Agent invoking task (HTTP GET /api/v1/inference)...'
    ]);

    setTimeout(() => {
      setStep4Log(prev => [
        ...prev,
        isJa ? '2. サーバーが「HTTP 402 Payment Required」を返却 (必要額: $0.15 USDC)' : '2. Server responded with "HTTP 402 Payment Required" ($0.15 USDC required)'
      ]);
    }, 600);

    setTimeout(() => {
      setStep4Log(prev => [
        ...prev,
        isJa ? '3. Policy Engine検証: 1回上限 ($5.00以内)・日次枠内 ➔ 自動承認 (ポップアップ不要)' : '3. Policy Engine verified: Within limits (<$5.00) ➔ Auto-approved (No popup!)'
      ]);
    }, 1200);

    setTimeout(() => {
      setStep4Log(prev => [
        ...prev,
        isJa ? '4. TBA口座 (0x892a...6091) から即時バックグラウンド決済完了 (200 OK - 18ms)' : '4. Settled invisibly via TBA (0x892a...6091) (200 OK - 18ms latency)'
      ]);
      setStep4Running(false);
      setSimulatedCount(prev => prev + 1);

      if (onDeploySampleAction) {
        onDeploySampleAction('AI Compute Inference (x402)', '$0.15');
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col text-white animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900 bg-black shrink-0">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-white text-black font-black text-xs flex items-center justify-center font-mono">
              A
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              {isJa ? 'AWallet ガイド＆操作' : 'AWallet Guide & Operations'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLang('ja')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                lang === 'ja' ? 'bg-white text-black font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              JP
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                lang === 'en' ? 'bg-white text-black font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-900 bg-zinc-950 px-3 shrink-0 text-xs overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('steps4')}
          className={`py-3 px-3 border-b-2 font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'steps4'
              ? 'border-emerald-400 text-emerald-300 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap size={14} className={activeTab === 'steps4' ? 'text-emerald-400' : 'text-zinc-500'} />
          <span>{isJa ? '4ステップ使い方' : '4-Step Flow'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comparison')}
          className={`py-3 px-3 border-b-2 font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'comparison'
              ? 'border-blue-400 text-blue-300 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers size={14} className={activeTab === 'comparison' ? 'text-blue-400' : 'text-zinc-500'} />
          <span>{isJa ? 'ウォレット比較' : 'Comparison'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules3')}
          className={`py-3 px-3 border-b-2 font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'rules3'
              ? 'border-amber-400 text-amber-300 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck size={14} className={activeTab === 'rules3' ? 'text-amber-400' : 'text-zinc-500'} />
          <span>{isJa ? '3つの原則' : '3 Rules'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('why')}
          className={`py-3 px-3 border-b-2 font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'why'
              ? 'border-purple-400 text-purple-300 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <HelpCircle size={14} className={activeTab === 'why' ? 'text-purple-400' : 'text-zinc-500'} />
          <span>{isJa ? 'なぜAIが口座を？' : 'Why Invisible?'}</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg w-full mx-auto space-y-5 text-zinc-300 text-xs leading-relaxed pb-28">
        
        {/* TAB 1: 4 Steps Flow (Interactive Stepper & Simulation) */}
        {activeTab === 'steps4' && (
          <div className="space-y-4">
            {/* Header intro card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Zap size={14} />
                  <span>A2A / Invisible Finance 4-Step Quick Flow</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isJa ? '実践モード' : 'Interactive'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isJa ? 'A2A / 不可視金融の使い方 4ステップ' : 'How to Use in 4 Steps'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {isJa
                  ? 'わずか4つのステップで、あなたの管理下に自律決済型AIエージェントを立ち上げ、不可視の自動支払いを体験できます。'
                  : 'In just 4 steps, launch an autonomous AI settlement agent under your control and experience invisible micropayments.'}
              </p>
            </div>

            {/* Stepper list */}
            <div className="space-y-3.5">
              {/* STEP 1 */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {isJa ? 'Step 1: Anchor IDを発行する' : 'Step 1: Create Anchor ID'}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {isJa ? '生体認証/パスキーで主権IDを生成' : 'Passkey & Sovereign Root ID'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-mono flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>{isJa ? '完了済' : 'Active'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isJa
                    ? 'AWalletを開き、生体認証やパスキーで自分の主権ID（Anchor ID）を生成します。AIエージェントのすべての権限はこのIDに帰属します。'
                    : 'Launch AWallet and generate your sovereign identity using passkeys or biometric security. All agent rights anchor here.'}
                </p>
                <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                  <span className="truncate max-w-[220px]">DID: {userDid}</span>
                  <span className="text-emerald-400 font-semibold">{isJa ? 'Passkey認証済' : 'Passkey Active'}</span>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {isJa ? 'Step 2: AIエージェントを生成する' : 'Step 2: Mint Agent SBT+TBA'}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        AtomicMint.sol (SBT ＋ Token Bound Account)
                      </p>
                    </div>
                  </div>
                  {step2Minted && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-400 border border-blue-800/40 text-[10px] font-mono flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>{isJa ? '生成済' : 'Minted'}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isJa
                    ? 'ボタン1つで AtomicMint を実行。AI専用の身分証（SBT）と専用口座（TBA）をウォレット内に不可分で同時作成します。'
                    : 'Execute AtomicMint with one click to atomically provision a non-transferable identity (SBT) and smart contract account (TBA).'}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleRunAtomicMint}
                    disabled={step2Minting}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {step2Minting ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    <span>{step2Minting ? (isJa ? 'AtomicMint 実行中...' : 'Executing Mint...') : (isJa ? 'AtomicMint を再実行' : 'Re-Mint Agent SBT+TBA')}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-[10px] font-mono space-y-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span>SBT Token:</span>
                    <span className="text-zinc-200">#01 (Tive ◉AI Worker)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TBA Address:</span>
                    <span className="text-emerald-400">0x892a78BFe912A346C898302A04bB5C2d38eA6091</span>
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {isJa ? 'Step 3: 予算とルールを設定する' : 'Step 3: Define Budget & Guardrails'}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {isJa ? '活動資金と1回あたり上限額' : 'Spending caps & Policy Engine'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/40 text-[10px] font-mono">
                    Policy Active
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isJa
                    ? 'AIのTBAに少額の活動資金（0.01 ETHなど）を入れ、「1回あたりの最大決済額」を設定します。この枠内のみAIが自律決済できます。'
                    : 'Deposit working capital into the TBA (e.g., 0.01 ETH) and configure spending caps or whitelisted protocols.'}
                </p>

                {/* Preset selectors */}
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-mono block mb-1">
                      {isJa ? 'AI活動資金プリセット:' : 'Deposit Capital Preset:'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { val: '0.005', label: '0.005 ETH' },
                        { val: '0.01', label: '0.01 ETH' },
                        { val: '25', label: '25 USDC' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setBudgetCap(item.val as any)}
                          className={`py-1.5 rounded-lg text-[11px] font-mono font-semibold border transition-all cursor-pointer ${
                            budgetCap === item.val
                              ? 'bg-amber-500 text-black border-amber-400 font-bold'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-mono block mb-1">
                      {isJa ? '1回あたりの最大決済額（超過時は本人承認必要）:' : 'Max Cap Per Tx (Exceeding requires biometric approval):'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { val: '1', label: '$1.00' },
                        { val: '5', label: '$5.00' },
                        { val: '10', label: '$10.00' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setSingleTxCap(item.val as any)}
                          className={`py-1.5 rounded-lg text-[11px] font-mono font-semibold border transition-all cursor-pointer ${
                            singleTxCap === item.val
                              ? 'bg-amber-500 text-black border-amber-400 font-bold'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 4 */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {isJa ? 'Step 4: AIを稼働させる' : 'Step 4: Deploy & Invisible Settle'}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {isJa ? 'x402 バックグラウンド自動決済' : 'x402 Background Settlement'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-mono">
                    {simulatedCount > 0 ? `${simulatedCount} txs done` : 'Ready'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isJa
                    ? 'AIを外部タスクに投入。AI同士のデータ購入や推論支払いは、バックグラウンドの「x402決済」で人間を介さず自動完了します。'
                    : 'Deploy the agent. Inter-agent data purchases and compute micro-fees settle automatically in the background using x402 payment flows.'}
                </p>

                <div className="pt-1">
                  <button
                    onClick={handleRunDeployAndSettle}
                    disabled={step4Running}
                    className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {step4Running ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Zap size={14} />
                    )}
                    <span>
                      {step4Running
                        ? (isJa ? 'x402 自動決済中...' : 'Executing x402 Settlement...')
                        : (isJa ? '⚡ x402 決済デモを実行（ポップアップ不要）' : '⚡ Simulate Invisible x402 Settlement')}
                    </span>
                  </button>
                </div>

                {/* Real-time simulation trace terminal */}
                {step4Log.length > 0 && (
                  <div className="mt-2 p-3 rounded-xl bg-black border border-emerald-950 font-mono text-[10px] space-y-1 text-zinc-300 animate-fade-in">
                    <div className="text-emerald-400 font-bold mb-1">
                      {isJa ? '▼ x402 決済実行トレース:' : '▼ x402 Settlement Trace:'}
                    </div>
                    {step4Log.map((log, i) => (
                      <div key={i} className="leading-tight text-zinc-300">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Wallet Comparison Table */}
        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1.5">
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-semibold">
                1. {isJa ? '既存ウォレットとの比較' : 'Comparison with Existing Wallets'}
              </span>
              <h2 className="text-sm font-bold text-white">
                {isJa ? 'なぜ従来のウォレットではAI自律決済ができないのか？' : 'Why Existing Wallets Cannot Handle AI Autonomy'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {isJa
                  ? 'MetaMaskやLedgerは人間が1回ずつ手動署名することを前提に設計されています。1秒に数十回取引するAI時代にはAWalletのアーキテクチャが不可欠です。'
                  : 'MetaMask, Coinbase Wallet, and Ledger require manual user confirmation. AWallet provides sovereign agentic execution governed by an Anchor ID.'}
              </p>
            </div>

            {/* Comparison Table Container */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3">{isJa ? 'ウォレット' : 'Wallet'}</th>
                      <th className="py-2.5 px-3">{isJa ? '主な用途・主体' : 'Primary Actor'}</th>
                      <th className="py-2.5 px-3">{isJa ? '秘密鍵の扱い' : 'Key Management'}</th>
                      <th className="py-2.5 px-3">{isJa ? 'AI自律決済' : 'AI Autonomy'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {/* MetaMask */}
                    <tr className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">MetaMask</td>
                      <td className="py-2.5 px-3 text-zinc-300">{isJa ? '人間（ブラウザ/アプリ）' : 'Human (Browser/App)'}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{isJa ? 'ソフトウェア管理' : 'Software storage'}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          ✕ {isJa ? '不可 (毎回人間の署名必要)' : 'Unsupported (Manual prompt)'}
                        </span>
                      </td>
                    </tr>

                    {/* Coinbase Wallet */}
                    <tr className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">Coinbase Wallet</td>
                      <td className="py-2.5 px-3 text-zinc-300">{isJa ? '人間（セルフカストディ）' : 'Human (Self-custody)'}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{isJa ? 'クラウド/生体認証' : 'Cloud / Passkey'}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          ✕ {isJa ? '不可 (人間主体の設計)' : 'Unsupported (Human UX)'}
                        </span>
                      </td>
                    </tr>

                    {/* Ledger */}
                    <tr className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">Ledger (HW)</td>
                      <td className="py-2.5 px-3 text-zinc-300">{isJa ? '人間（長期保管）' : 'Human (Cold storage)'}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{isJa ? '物理デバイス隔離' : 'Isolated hardware'}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          ✕ {isJa ? '不可 (物理ボタン押下必要)' : 'Unsupported (Button push)'}
                        </span>
                      </td>
                    </tr>

                    {/* AWallet (Highlighted) */}
                    <tr className="bg-emerald-950/20 border-t-2 border-emerald-500/50">
                      <td className="py-3 px-3 font-bold text-white flex items-center space-x-1.5">
                        <div className="w-4 h-4 rounded bg-white text-black text-[9px] font-black flex items-center justify-center font-mono">
                          A
                        </div>
                        <span className="text-emerald-300">AWallet</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-emerald-200">
                        {isJa ? '人間 ＋ 自律型AIエージェント' : 'Human + Autonomous AI'}
                      </td>
                      <td className="py-3 px-3 text-zinc-300">
                        {isJa ? 'Anchor ID傘下のTBA' : 'TBA governed by Anchor ID'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] inline-flex items-center gap-1">
                          ✓ {isJa ? '完全対応 (統制下で自律)' : 'Fully Supported'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Explanatory cards */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <h4 className="text-xs font-semibold text-zinc-200">
                {isJa ? '従来のウォレットとの本質的な違い' : 'Core Architectural Difference'}
              </h4>
              <p className="text-[11px] text-zinc-400">
                {isJa
                  ? 'これまでのウォレットにボットを繋ぐと「秘密鍵の漏洩」または「無限決済の暴走」という致命的なリスクがありました。AWalletは「ERC-6551（Token Bound Account）」と「決定論的Policy Engine」により、秘密鍵を渡さずに安全な自律決済を実現しています。'
                  : 'Handing raw private keys to AI bots invites theft or uncontrolled fund drain. AWallet decouples execution rights via ERC-6551 Token Bound Accounts and deterministic policy engine rules.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: 3 Rules of AWallet */}
        {activeTab === 'rules3' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1.5">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                2. {isJa ? 'AWallet の「3つの原則」' : 'The 3 Rules of AWallet'}
              </span>
              <h2 className="text-sm font-bold text-white">
                {isJa ? '人間が主権を持ち、AIが統制下で動く鉄則' : 'Human Sovereignty with Bound Autonomous Agency'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {isJa
                  ? 'AWalletは以下の3つの不可侵の原則に基づいて構築されています。'
                  : 'AWallet operates strictly under three inviolable core principles.'}
              </p>
            </div>

            <div className="space-y-3">
              {/* Rule 1 */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-2 relative overflow-hidden">
                <div className="flex items-center space-x-2 text-white">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-bold text-xs text-amber-300">
                    {isJa ? 'Rule 1: 人間が主権の根幹である' : 'Rule 1: Human Root Sovereignty'}
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {isJa
                    ? 'AIエージェントは独立した秘密鍵を持たず、人間の「Anchor ID」傘下のSBT（身分証）に紐づきます。人間はいつでもAIの権限停止・資金回収が可能です。'
                    : 'AI agents never hold raw root keys. They operate strictly under the human’s "Anchor ID." The human retains full rights to revoke permissions and reclaim funds at any time.'}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-amber-400/80">
                  <Check size={12} />
                  <span>{isJa ? '秘密鍵の隔離 & キルスイッチ保証' : 'Isolated Keys & Sovereign Kill-Switch'}</span>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-2 relative overflow-hidden">
                <div className="flex items-center space-x-2 text-white">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-bold text-xs text-blue-300">
                    {isJa ? 'Rule 2: 身分証と口座は不可分である' : 'Rule 2: Inseparable Identity & Account'}
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {isJa
                    ? 'AIの身分証（SBT）と専用口座（TBA）は AtomicMint.sol により常に1対1で不可分に生成されます。身元のない匿名ウォレットの暴走を防ぎます。'
                    : 'An agent’s identity credential (SBT) and operational wallet (TBA) are deployed atomically via AtomicMint.sol. No unverified, orphaned wallets are permitted.'}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-blue-400/80">
                  <Check size={12} />
                  <span>{isJa ? 'AtomicMint.sol による1対1原子結合' : '1:1 Atomic Provisioning via AtomicMint.sol'}</span>
                </div>
              </div>

              {/* Rule 3 */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-2 relative overflow-hidden">
                <div className="flex items-center space-x-2 text-white">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-bold text-xs text-emerald-300">
                    {isJa ? 'Rule 3: 境界線の限定的自律' : 'Rule 3: Bounded Autonomy within Limits'}
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {isJa
                    ? 'AIは人間が事前に定めた「日次支出上限」「許可コントラクト」の範囲内でのみ、人間の承認なしで自律署名・決済を行います。境界を越える取引はTier3/5ポリシーで即座に人間の生体認証を要求します。'
                    : 'AI executes signatures independently only within predefined guardrails (e.g., daily velocity limits, whitelisted contracts). Human intervention is required only if boundaries are breached.'}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/80">
                  <Check size={12} />
                  <span>{isJa ? 'Policy Engine による決定論的保護' : 'Deterministic Policy Engine Protection'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Why Q&A (Why Can AI Hold Account & Why Invisible Finance) */}
        {activeTab === 'why' && (
          <div className="space-y-4">
            {/* Question 1 */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center space-x-2 text-purple-300">
                <Cpu size={16} />
                <h3 className="font-bold text-xs text-white">
                  {isJa ? '4. なぜAIが口座を持てるのか？' : '4. Why Can AI Hold an Account?'}
                </h3>
              </div>
              
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 space-y-1">
                  <span className="text-[10px] font-mono text-red-400 font-semibold block">
                    {isJa ? '✕ 銀行口座は持てない' : '✕ No Fiat Bank Accounts'}
                  </span>
                  <p className="text-[11px] text-zinc-300">
                    {isJa
                      ? '法人格のないAIは、銀行の本人確認（KYC）を通せないため法定通貨の口座を作れません。'
                      : 'AI cannot pass KYC/AML identity checks or hold legal corporate standing on its own.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold block">
                    {isJa ? '◎ スマートコントラクトなら持てる (ERC-6551)' : '◎ Smart Contracts Enable Agency (ERC-6551 TBA)'}
                  </span>
                  <p className="text-[11px] text-zinc-300">
                    {isJa
                      ? 'Web3の「ERC-6551（Token Bound Account）」技術を使い、「人間が保有するNFT（SBT）自体に口座を持たせる」 という仕組みを採用しているためです。法的な所有者は人間でありながら、口座の操作権限だけをAIに安全に委任できます。'
                      : 'AWallet leverages ERC-6551 (Token Bound Accounts) to bind an on-chain account directly to an identity token (SBT). The human operator remains the ultimate sovereign owner, while the AI runtime receives scoped execution rights.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Question 2 */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-300">
                <Zap size={16} />
                <h3 className="font-bold text-xs text-white">
                  {isJa ? '5. なぜ Invisible Finance（不可視の金融）なのか？' : '5. Why "Invisible Finance"?'}
                </h3>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {isJa ? (
                      <>
                        AIが1秒間に数十回のAPI呼び出しや推論データの売買を行う時代に、毎回人間がMetaMaskのポップアップを開いて承認ボタンを押すことは物理的に不可能です。
                      </>
                    ) : (
                      <>
                        In an agentic economy where software invokes dozens of micro-inferences and data feeds every minute, prompting a human with wallet confirmation popups is fundamentally broken.
                      </>
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 space-y-1.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold block">
                    {isJa ? 'HTTP 402規格とバックグラウンド自動決済' : 'HTTP 402 Standard & Background Settle'}
                  </span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {isJa ? (
                      <>
                        本人の事前許可ルールの範囲内で、<strong className="text-cyan-300 font-mono">HTTP 402</strong> 規格に沿って裏側（バックグラウンド）で支払いが自動完結するため、決済という行為そのものがユーザーの視界から消える（Invisibleになる）からです。
                      </>
                    ) : (
                      <>
                        By handling value transfers via native HTTP 402 standard within preset limits, transactions execute autonomously in the background—rendering payments completely friction-free and invisible to the user.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-zinc-900 p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => setActiveTab('steps4')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'steps4'
                ? 'bg-white hover:bg-zinc-200 text-black shadow-md'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800'
            }`}
          >
            <Zap size={14} />
            <span>{isJa ? '4ステップ操作を開始' : 'Start 4-Step Flow'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {isJa ? '閉じる' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
