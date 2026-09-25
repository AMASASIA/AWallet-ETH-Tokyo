import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Cpu, 
  User as UserIcon, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Coins, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Send, 
  Download, 
  Palette, 
  FileText, 
  Code, 
  Globe,
  Sliders
} from 'lucide-react';
import { AgentAccount, A2ATransaction, AiWorkerMarketTask, User } from '../types';
import { a2aService } from '../services/a2aService';

interface A2AEconomyViewProps {
  user: User;
  onBack: () => void;
  lang?: 'ja' | 'en';
  onLogActivity?: (detail: string, type: 'Transfer' | 'Execution' | 'Policy') => void;
}

export const A2AEconomyView: React.FC<A2AEconomyViewProps> = ({
  user,
  onBack,
  lang = 'ja',
  onLogActivity,
}) => {
  const isJa = lang === 'ja';
  const [account, setAccount] = useState<AgentAccount | null>(null);
  const [tasks, setTasks] = useState<AiWorkerMarketTask[]>([]);
  const [transactions, setTransactions] = useState<A2ATransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Custom A2A Outbound Form State
  const [showA2APayModal, setShowA2APayModal] = useState<boolean>(false);
  const [targetAgentName, setTargetAgentName] = useState<string>('DeepSeek Audit Agent v3');
  const [targetAmountUsdc, setTargetAmountUsdc] = useState<string>('2.50');
  const [taskDescription, setTaskDescription] = useState<string>('スマートコントラクトの静的セキュリティ解析');
  const [isPayingAgent, setIsPayingAgent] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const { agentAccount, marketTasks } = await a2aService.getAgentAccount(user.did, user.address);
      const txs = await a2aService.getTransactions();
      setAccount(agentAccount);
      setTasks(marketTasks);
      setTransactions(txs);
    } catch (err: unknown) {
      console.error('Failed to load A2A data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.did, user.address]);

  // Execute Worker Task to Earn Crypto
  const handleEarnTask = async (task: AiWorkerMarketTask) => {
    try {
      setProcessingTaskId(task.id);
      setNotification(null);

      const result = await a2aService.executeTask(task.id);
      setAccount(result.updatedAccount);
      setTransactions((prev) => [result.transaction, ...prev]);

      setNotification({
        type: 'success',
        message: isJa 
          ? `タスク完了！ AIサブ口座に +$${task.rewardUsdc} USDC が即時着金しました。`
          : `Task completed! +$${task.rewardUsdc} USDC received into AI Sub-Account.`,
      });

      if (onLogActivity) {
        onLogActivity(`A2A収益獲得: ${task.title} (+$${task.rewardUsdc} USDC)`, 'Execution');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: 'error', message: msg });
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Pay Another AI Agent (A2A Autonomous Transfer)
  const handleA2APaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    try {
      setIsPayingAgent(true);
      setNotification(null);

      const amount = parseFloat(targetAmountUsdc);
      const result = await a2aService.payAgent({
        targetAgentName,
        taskType: 'DATA_ORCHESTRATION',
        taskTitle: taskDescription,
        amountUsdc: amount,
      });

      setAccount(result.updatedAccount);
      setTransactions((prev) => [result.transaction, ...prev]);
      setShowA2APayModal(false);

      setNotification({
        type: 'success',
        message: isJa
          ? `A2A決済完了！ 外部AI (${targetAgentName}) へ $${amount} USDC を送金しました。`
          : `A2A Payment settled! Sent $${amount} USDC to ${targetAgentName}.`,
      });

      if (onLogActivity) {
        onLogActivity(`A2A外部AI決済: ${targetAgentName} (-$${amount} USDC)`, 'Transfer');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsPayingAgent(false);
    }
  };

  // Sweep AI Earnings to Anchor Account
  const handleSweepToOwner = async () => {
    if (!account || account.balanceUsdc <= 0) return;

    try {
      setIsSweeping(true);
      setNotification(null);

      const result = await a2aService.sweepToOwner();
      setAccount(result.updatedAccount);
      setTransactions((prev) => [result.transaction, ...prev]);

      setNotification({
        type: 'success',
        message: isJa
          ? `還元成功！ 親Anchor口座 (${user.address.slice(0, 6)}...${user.address.slice(-4)}) へ $${result.sweptAmount} USDC を還元しました。`
          : `Swept $${result.sweptAmount} USDC directly to Owner Anchor Account.`,
      });

      if (onLogActivity) {
        onLogActivity(
          isJa 
            ? `AI収益の親Anchor口座還元: $${result.sweptAmount} USDC` 
            : `AI Revenue Swept: $${result.sweptAmount} USDC`, 
          'Transfer'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsSweeping(false);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'CREATIVE_ART':
        return <Palette size={16} className="text-pink-400" />;
      case 'DEEP_RESEARCH':
        return <FileText size={16} className="text-blue-400" />;
      case 'CODE_AUDIT':
        return <Code size={16} className="text-emerald-400" />;
      default:
        return <Globe size={16} className="text-amber-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-20 animate-fade-in select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-4 h-14 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu size={13} />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            A2A Economy &amp; AI Sub-Account
          </span>
        </div>

        <button
          onClick={loadData}
          className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 space-y-6">
        {/* Architecture Banner: Human Anchor ID ➔ AI Sub-Account Hierarchy */}
        <div className="rounded-2xl border border-emerald-950 bg-gradient-to-b from-emerald-950/20 to-black p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5 uppercase tracking-wider font-semibold">
              <ShieldCheck size={13} />
              <span>DID Anchor &amp; Sub-Account Hierarchy</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Base L2 ERC-4337
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Level 1: Anchor Account (DID) */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserIcon size={12} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {isJa ? 'Anchor アカウント (DID)' : 'Anchor Account (DID)'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {isJa ? 'SBT身元保証 / ルート管理' : 'SBT Identity Verified / Root Control'}
                  </div>
                </div>
              </div>
              <div className="pt-1 font-mono text-[10px] text-zinc-400 truncate">
                DID: <span className="text-zinc-200">{user.did}</span>
              </div>
              <div className="font-mono text-[10px] text-zinc-400 truncate">
                Address: <span className="text-blue-300">{user.address}</span>
              </div>
            </div>

            {/* Level 2: AI Agent Sub-Account */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-emerald-900/60 space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Cpu size={12} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-300">AI自律口座 (Sub-Account)</div>
                  <div className="text-[10px] text-zinc-400">Tive ◉AI Worker #01 / Session Key</div>
                </div>
              </div>
              <div className="pt-1 font-mono text-[10px] text-zinc-400 truncate">
                Agent DID: <span className="text-zinc-200">{account?.agentDid}</span>
              </div>
              <div className="font-mono text-[10px] text-zinc-400 truncate">
                Sub-Address: <span className="text-emerald-400">{account?.subAddress}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-900 pt-2.5">
            {isJa ? (
              <>
                <strong className="text-zinc-200">Anchor ID (DID/SBT)</strong> の傘下に、AIが専用の
                <strong className="text-emerald-400"> オンチェーン独立口座 (Sub-Account)</strong> を保持。
                外部タスクで暗号資産を自律的に稼ぎ、Policy Engineの枠内でAI同士（A2A）で決済します。
              </>
            ) : (
              <>
                Under the Anchor ID, the AI maintains a dedicated on-chain Sub-Account to autonomously earn and pay crypto via A2A protocols.
              </>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-red-950/40 border-red-800 text-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-red-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-zinc-400 hover:text-white text-[11px] ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* AI Balance & Revenue Summary Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coins size={18} className="text-amber-400" />
              <span className="text-xs font-semibold text-zinc-300">AI 専用サブ口座残高</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Policy Engine: Active</span>
            </div>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
              ${account?.balanceUsdc.toFixed(2) || '0.00'}
            </span>
            <span className="text-sm font-semibold text-zinc-400">USDC (Base)</span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-center space-x-1 text-[11px] text-zinc-400 mb-1">
                <ArrowDownLeft size={13} className="text-emerald-400" />
                <span>累計獲得収益 (Earned)</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-300">
                +${account?.totalEarnedUsdc.toFixed(2) || '0.00'} USDC
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-center space-x-1 text-[11px] text-zinc-400 mb-1">
                <ArrowUpRight size={13} className="text-amber-400" />
                <span>A2A 支払総額 (Spent)</span>
              </div>
              <div className="text-lg font-bold font-mono text-zinc-300">
                -${account?.totalSpentUsdc.toFixed(2) || '0.00'} USDC
              </div>
            </div>
          </div>

          {/* Quick Actions: Sweep to Anchor & A2A Pay */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
            <button
              onClick={handleSweepToOwner}
              disabled={isSweeping || !account || account.balanceUsdc <= 0}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-900 disabled:text-zinc-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
            >
              {isSweeping ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              <span>{isJa ? '親口座へ全額還元' : 'Sweep to Anchor'}</span>
            </button>

            <button
              onClick={() => setShowA2APayModal(true)}
              className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Send size={13} className="text-amber-400" />
              <span>{isJa ? '外部AIへ発注・送金' : 'Pay External AI'}</span>
            </button>
          </div>
        </div>

        {/* Section 1: AI Worker Market (Earn Crypto) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">
                {isJa ? 'AI Worker 受注マーケット (稼ぐ)' : 'AI Worker Market (Earn)'}
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500">HTTP 402 Payment Required</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            {isJa
              ? '外部のAIエージェントやDAOが提示したタスクを受注し、成果物を納品してUSDCを獲得します。'
              : 'Execute autonomous tasks requested by external agents and earn USDC directly into the AI sub-account.'}
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {tasks.map((task) => {
              const isExecuting = processingTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex items-start space-x-2.5">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                        {getTaskIcon(task.taskType)}
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-white">{task.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Client: <span className="text-zinc-300">{task.clientName}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 line-clamp-2">
                          {task.prompt}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        +${task.rewardUsdc.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-zinc-500">USDC</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono text-[10px]">
                      {task.difficulty}
                    </span>

                    <button
                      onClick={() => handleEarnTask(task)}
                      disabled={isExecuting}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>実行中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          <span>{isJa ? '受注して稼ぐ' : 'Execute & Earn'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: A2A Settlement Receipts (Transactions) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>A2A オンチェーントランザクション履歴</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">Base Chain ID: 8453</span>
          </div>

          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        tx.type === 'EARN_REVENUE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : tx.type === 'A2A_PAY_OUT'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {tx.type === 'EARN_REVENUE' ? '収益着金' : tx.type === 'A2A_PAY_OUT' ? 'A2A送金' : '還元スウィープ'}
                    </span>
                    <span className="font-semibold text-white truncate max-w-[200px]">
                      {tx.taskTitle}
                    </span>
                  </div>

                  <span
                    className={`font-mono font-bold ${
                      tx.type === 'EARN_REVENUE' ? 'text-emerald-400' : 'text-zinc-300'
                    }`}
                  >
                    {tx.type === 'EARN_REVENUE' ? '+' : '-'}${tx.amountUsdc.toFixed(2)} USDC
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <div className="truncate max-w-[240px]">
                    From: <span className="text-zinc-300">{tx.fromEntity.name}</span>
                  </div>
                  <div className="font-mono text-[10px] text-zinc-400">{tx.timestamp}</div>
                </div>

                {tx.taskOutputSnippet && (
                  <div className="p-2 rounded bg-zinc-900/60 text-[10px] font-mono text-zinc-400 leading-relaxed border border-zinc-900">
                    &gt; {tx.taskOutputSnippet}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600 pt-0.5">
                  <span className="truncate max-w-[200px]">tx: {tx.txHash.slice(0, 14)}...{tx.txHash.slice(-6)}</span>
                  <span>Gas: ${tx.feeUsdc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Outbound A2A Payment Form */}
      {showA2APayModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <Send size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">外部AIへの発注・自律送金 (A2A)</h3>
              </div>
              <button
                onClick={() => setShowA2APayModal(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleA2APaySubmit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">宛先AIエージェント名</label>
                <input
                  type="text"
                  value={targetAgentName}
                  onChange={(e) => setTargetAgentName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">発注タスク内容</label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>支払金額 (USDC)</span>
                  <span>上限: ${account?.sessionPolicy.singleTxLimitUsd} USDC</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  max={account?.sessionPolicy.singleTxLimitUsd || 20}
                  value={targetAmountUsdc}
                  onChange={(e) => setTargetAmountUsdc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300">
                Policy Engine のセッションキー枠内（単一上限: ${account?.sessionPolicy.singleTxLimitUsd}）でのみ自律実行されます。
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowA2APayModal(false)}
                  className="w-1/2 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPayingAgent}
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5"
                >
                  {isPayingAgent ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>送金実行</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
