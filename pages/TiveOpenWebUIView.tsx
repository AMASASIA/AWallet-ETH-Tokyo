import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  CircleDot, 
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
  Lock,
  Globe,
  Network,
  Mic,
  Radio
} from 'lucide-react';
import { SlideToConfirm } from '../components/SlideToConfirm';
import { TablerButterfly } from '../components/TablerButterfly';
import { BiometricAuthModal } from '../components/BiometricAuthModal';
import { TiveObservingSessionView } from '../components/TiveObservingSessionView';
import { TiveVisionView } from '../components/TiveVisionView';
import { TiveLiveVoiceModal, LiveProposal } from '../components/TiveLiveVoiceModal';
import { InvisibleAction } from '../types';
import { I18N_DICTIONARY, SupportedLocale } from '../services/i18n';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  metadata?: string;
  actionProposal?: {
    destination: string;
    amountLabel: string;
    reason: string;
    whyApprovalNeeded: string;
    targetActionId?: string;
  };
}

interface TiveOpenWebUIViewProps {
  onBack: () => void;
  pendingActions: InvisibleAction[];
  onApproveAction: (id: string, viaTap: boolean, authResult?: import('../services/webauthnService').WebAuthnAssertionResult) => Promise<void>;
  onAddAction?: (action: InvisibleAction) => void;
  userAddress?: string;
  baseName?: string;
}

export const TiveOpenWebUIView: React.FC<TiveOpenWebUIViewProps> = ({
  onBack,
  pendingActions,
  onApproveAction,
  onAddAction,
  userAddress = '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01',
  baseName = 'alex.base.eth',
}) => {
  const [activeMode, setActiveMode] = useState<'vision' | 'session' | 'chat'>('vision');
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  // Primary language is English by default
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('EN');
  const [isTyping, setIsTyping] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [biometricModalAction, setBiometricModalAction] = useState<InvisibleAction | null>(null);
  const [activeSlideActionId, setActiveSlideActionId] = useState<string | null>(
    pendingActions.length > 0 ? pendingActions[0].id : 'act-1'
  );
  const [slideConfirmedMap, setSlideConfirmedMap] = useState<Record<string, boolean>>({});
  
  // Advanced Details & Custom Checker accordion state (folded by default)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [customAddressQuery, setCustomAddressQuery] = useState('');
  const [customAddressResult, setCustomAddressResult] = useState<{
    address: string;
    rpcLatency: string;
    codeHash: string;
    verified: boolean;
    isSanctioned: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = I18N_DICTIONARY[currentLocale];

  // Open WebUI exact dark thread matching user reference mockup (image.png)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'user',
      content: 'Can you summarize this document in English?',
    },
    {
      id: 'm-2',
      sender: 'assistant',
      content: 'Certainly. Processing locally in memory; no private keys or data are transmitted outside the secure boundary. In-store coffee payment (¥480) and executive gold CFD strategic return ($5,000) proposals have been synthesized.',
      metadata: '138 tok/s · ctx 8192 · qwen2.5:14b + butterfly-api',
      actionProposal: {
        destination: 'Blue Bottle Coffee (0x92f...4d1e)',
        amountLabel: '¥480 (~3.15 USDC)',
        reason: 'Generated from user request for counter coffee payment checkout.',
        whyApprovalNeeded: 'Policy Engine Tier 2: Micro POS checkout under ¥1,000. 1-step slide approval.',
        targetActionId: 'act-1',
      }
    }
  ]);

  // When locale changes, update sample messages if unchanged
  useEffect(() => {
    setMessages([
      {
        id: 'm-1',
        sender: 'user',
        content: t.sampleUserMsg,
      },
      {
        id: 'm-2',
        sender: 'assistant',
        content: t.sampleAssistantMsg,
        metadata: '138 tok/s · ctx 8192 · qwen2.5:14b + butterfly-api',
        actionProposal: {
          destination: 'Blue Bottle Coffee (0x92f...4d1e)',
          amountLabel: t.sampleActionAmount,
          reason: t.sampleActionReason,
          whyApprovalNeeded: t.sampleActionWhy,
          targetActionId: 'act-1',
        }
      }
    ]);
  }, [currentLocale]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const activeAction = pendingActions.find(a => a.id === activeSlideActionId) || pendingActions[0];

  const handleSlideConfirm = async () => {
    if (!activeAction) return;

    // Strict enforcement: Tier 4 and Tier 5 (as well as Tier 3) require WebAuthn Biometric verification
    if (activeAction.tier === 4 || activeAction.tier === 5 || activeAction.tier === 3) {
      setBiometricModalAction(activeAction);
      return;
    }

    try {
      await onApproveAction(activeAction.id, false);
      setSlideConfirmedMap(prev => ({ ...prev, [activeAction.id]: true }));
      
      const confirmMsg: Message = {
        id: `m-${Date.now()}`,
        sender: 'assistant',
        content: t.confirmExecutionText(activeAction.desc),
        metadata: '142 tok/s · ctx 8192 · deterministic policy verified',
      };
      setMessages(prev => [...prev, confirmMsg]);
    } catch (err) {
      console.error('Execution error:', err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userText = inputPrompt;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      content: userText,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let responseContent = currentLocale === 'JA'
        ? `ご指示「${userText}」をPolicy Engineにて照合しました。`
        : currentLocale === 'FR'
        ? `Votre demande "${userText}" a été vérifiée par le Policy Engine.`
        : currentLocale === 'KO'
        ? `요청하신 "${userText}" 지시사항을 Policy Engine에서 확인했습니다.`
        : `Verified intent "${userText}" against deterministic Policy Engine.`;

      let proposal: Message['actionProposal'] | undefined;

      if (userText.toLowerCase().includes('gold') || userText.includes('金') || userText.toLowerCase().includes('cfd')) {
        responseContent = currentLocale === 'JA'
          ? `エグゼクティブ特別会員枠の金CFD変動リターン戦略（$5,000）を照会しました。Tier 5規制商品前置ゲートを完全パスしています。`
          : currentLocale === 'FR'
          ? `Stratégie CFD Or à rendement variable ($5 000) vérifiée. Contrôle préalable Tier 5 validé avec succès.`
          : currentLocale === 'KO'
          ? `골드 CFD 변동 리턴 전략($5,000)을 조회했습니다. Tier 5 규제 사전 게이트를 통과했습니다.`
          : `Executive Gold CFD variable return position ($5,000) retrieved. Passed Tier 5 regulatory pre-gate.`;

        proposal = {
          destination: 'Licensed Commodity Vault (0x7aa...3c81)',
          amountLabel: '$5,000 (~33.5g Au / 5,000 USDC)',
          reason: currentLocale === 'JA'
            ? `ユーザー発言「${userText}」に基づき、金CFD変動リターン型ポジション構築を提案。`
            : `Proposed position build for gold CFD based on user statement "${userText}".`,
          whyApprovalNeeded: currentLocale === 'JA'
            ? 'Policy Engine Tier 5ゲート通過済。規制商品のためスライド承認による最終約定。'
            : 'Passed Tier 5 pre-gate. Regulated asset requires final slide approval signature.',
          targetActionId: 'act-5',
        };
        setActiveSlideActionId('act-5');
      } else if (userText.toLowerCase().includes('pay') || userText.includes('支払') || userText.includes('送金')) {
        responseContent = currentLocale === 'JA'
          ? `決済要求を検知しました。アドレスへの安全接続確認済みです。カード下部のスライダーをスライドして即時実行してください。`
          : `Payment intent detected. Verified destination address. Slide the card below to confirm immediately.`;

        proposal = {
          destination: 'Verified Partner Store (0x19a...ff42)',
          amountLabel: '¥1,200 (~7.80 USDC)',
          reason: currentLocale === 'JA'
            ? `ユーザー発言「${userText}」に基づく店舗決済プロポーザル。`
            : `Store payment proposal synthesized from user query "${userText}".`,
          whyApprovalNeeded: currentLocale === 'JA'
            ? 'Policy Engine Tier 2: 登録済みパートナー決済。スライドにて1ステップ実行。'
            : 'Policy Engine Tier 2: Registered partner payment. 1-step slide approval.',
          targetActionId: 'act-1',
        };
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        content: responseContent,
        metadata: '138 tok/s · ctx 8192 · qwen2.5:14b + butterfly-api',
        actionProposal: proposal,
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 600);
  };

  const handleCustomAddressCheck = () => {
    if (!customAddressQuery.trim()) return;
    const query = customAddressQuery.trim();
    setCustomAddressResult({
      address: query,
      rpcLatency: `${Math.floor(Math.random() * 25) + 12}ms (Base Mainnet / Infura Node)`,
      codeHash: `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...verified`,
      verified: true,
      isSanctioned: false,
    });
  };

  const isCurrentActionConfirmed = activeAction ? Boolean(slideConfirmedMap[activeAction.id]) : false;

  const locales: SupportedLocale[] = ['EN', 'JA', 'FR', 'KO'];

  return (
    <div className="min-h-screen text-zinc-100 font-sans pb-28 animate-fade-in flex flex-col justify-between">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between py-2.5 border-b border-zinc-900 px-1">
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 transition-all flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-medium">{t.backToWallet}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {t.tunnelStatus}
          </span>
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[10px] font-mono flex items-center gap-1.5 transition-all"
            title="Butterfly Effect Architecture & Audit Log"
          >
            <TablerButterfly size={13} className="text-pink-400" />
            <span>Architecture</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Vision (IMG_0475) vs Observing Session (IMG_0398 & IMG_0399) vs Chat & Proposals */}
      <div className="flex items-center justify-center p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 my-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveMode('vision')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1 ${
            activeMode === 'vision'
              ? 'bg-white text-black shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span className="text-pink-500 font-bold">◉</span>
          <span>Vision</span>
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 ml-0.5 animate-pulse" />
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('session')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1 ${
            activeMode === 'session'
              ? 'bg-white text-black shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span className="text-[10px] leading-none">▼</span>
          <span>Session</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('chat')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1 ${
            activeMode === 'chat'
              ? 'bg-white text-black shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>💬</span>
          <span>Chat</span>
        </button>
      </div>

      {activeMode === 'vision' ? (
        <div className="pt-1 pb-4 flex-1">
          <TiveVisionView
            onAddAction={onAddAction}
            onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
            onOpenObservingSession={() => setActiveMode('session')}
            onOpenChatThread={() => setActiveMode('chat')}
            userAddress={userAddress}
          />
        </div>
      ) : activeMode === 'session' ? (
        <div className="pt-2 pb-6">
          <TiveObservingSessionView
            userName={baseName ? baseName.replace('.base.eth', '') : 'takumi'}
            agentDid="did:awallet:agent:amy_01"
            agentSoul="amy.soul"
            soulBalance="1,250 SOUL"
            plurality="Π(Q) 4.25"
            stampsCount={8}
            dailyLimitUsdc={500}
            spentTodayUsdc={42.50}
            onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          />
        </div>
      ) : (
        /* Main 2-Card Focal Layout: 1. Open WebUI Chat Thread Card, 2. Modern Action Slide Card */
        <div className="space-y-4 pt-3 flex-1">
        
        {/* CARD 1: Exact "Open WebUI" Mockup Frame (from image.png) */}
        <div className="relative rounded-[36px] bg-[#0c0c0e] border border-zinc-800/80 p-5 shadow-2xl flex flex-col h-[380px] overflow-hidden">
          
          {/* Header Bar matching image.png with ⦿ Tive AI icon */}
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center space-x-2.5">
              <span className="text-lg font-bold text-white leading-none select-none">◉</span>
              <h2 className="text-sm font-bold text-white tracking-wide font-sans">Tive ◉AI</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsLiveVoiceOpen(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-all active:scale-95 shadow-xs"
                title="Start Gemini Live Voice Session"
              >
                <Mic size={12} className="animate-pulse" />
                <span>Live Voice</span>
              </button>

              {/* Language Switcher Badge: 4-locale tabs (EN/JA/FR/KO) */}
            <div className="flex items-center p-0.5 rounded-lg border border-zinc-700/80 bg-zinc-900/90 text-xs font-mono">
              <div className="px-1.5 py-0.5 text-zinc-500 flex items-center">
                <Globe size={11} />
              </div>
              {locales.map(loc => (
                <button
                  key={loc}
                  onClick={() => setCurrentLocale(loc)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    currentLocale === loc
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Model Subtitle (e.g. qwen2.5:14b · local) */}
          <div className="pt-2 text-[11px] font-mono text-zinc-500 tracking-wider">
            {t.modelSubtitle}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1 text-xs no-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#1e1e24] text-zinc-100 font-sans'
                      : 'text-zinc-100 font-sans'
                  }`}
                >
                  <p className="text-[13px]">{msg.content}</p>
                  
                  {/* Embedded Structured Proposal Pill (ApprovalCard source) */}
                  {msg.actionProposal && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1 font-mono text-[11px]">
                      <div className="text-pink-300 font-semibold flex items-center gap-1">
                        <Zap size={11} />
                        <span>{msg.actionProposal.amountLabel}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        {msg.actionProposal.reason}
                      </p>
                      <p className="text-[9px] text-zinc-500">
                        {msg.actionProposal.whyApprovalNeeded}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata Line like "138 tok/s · ctx 8192" in reference */}
                {msg.metadata && (
                  <div className="text-[10px] font-mono text-zinc-500 mt-1 pl-1">
                    {msg.metadata}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs italic font-mono pl-1">
                <span className="animate-pulse">● ● ●</span>
                <span>local inference running...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box like in image.png with outline send box */}
          <form onSubmit={handleSendMessage} className="pt-2 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-[#141418] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all font-sans"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim()}
                className="absolute right-3 p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 transition-all"
                title={t.sendTooltip}
              >
                <Send size={14} />
              </button>
            </div>
          </form>

          {/* Bottom Footer Bar: Tabler Butterfly Outline Icon for Audit Log / Resources */}
          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500 border-t border-zinc-900 mt-1">
            <button
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors group"
            >
              <TablerButterfly size={14} className="text-zinc-400 group-hover:text-pink-400 transition-colors" />
              <span>{t.auditLogFooter}</span>
            </button>
            <div className="flex items-center gap-1 text-[10px] text-zinc-600">
              <Lock size={11} />
              <span>{t.paymentBackendLabel}</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Modern "Slide to Confirm" Action Card (Rounded, Minimalist) */}
        <div className="relative rounded-[32px] bg-gradient-to-b from-[#141419]/90 to-[#0c0c10]/95 border border-white/10 backdrop-blur-2xl p-5 shadow-2xl space-y-4">
          
          {/* Card Top: Target Action Overview with Category Badge */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-semibold tracking-wide">
                  {t.actionCardCategory}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {activeAction?.category || 'Execution'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                {activeAction?.desc || t.actionCardDefaultTitle}
              </h3>
              <p className="text-xs text-zinc-400 leading-snug">
                {activeAction?.reason || t.actionCardDefaultReason}
              </p>
            </div>

            {/* Amount / Value Display */}
            <div className="text-right font-mono shrink-0 pl-2">
              <span className="text-lg font-bold text-white tracking-tight">
                {activeAction?.amountLabel || activeAction?.amount || '$0.00'}
              </span>
              <span className="block text-[10px] text-zinc-500">{t.gaslessLabel}</span>
            </div>
          </div>

          {/* Action Selector Pills (if multiple actions pending) */}
          {pendingActions.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {pendingActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => setActiveSlideActionId(action.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all shrink-0 border ${
                    activeSlideActionId === action.id
                      ? 'bg-white/15 text-white border-white/30 shadow-sm'
                      : 'bg-white/[0.03] text-zinc-400 border-white/5 hover:text-zinc-200'
                  }`}
                >
                  {action.desc.slice(0, 14)}...
                </button>
              ))}
            </div>
          )}

          {/* The "Slide to Confirm" Slider with Pink Knob */}
          <div className="pt-1">
            <SlideToConfirm
              id="wallet-slide-action"
              label={
                isCurrentActionConfirmed
                  ? t.slideConfirmedLabel
                  : `${t.slideLabelDefault}: ${activeAction?.desc || ''}`
              }
              onConfirm={handleSlideConfirm}
              isConfirmed={isCurrentActionConfirmed}
              color="pink"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
            <span className="flex items-center gap-1 text-zinc-400">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>{t.slideFooterRpc}</span>
            </span>
            <span className="text-pink-300/80">{t.slideFooterHint}</span>
          </div>
        </div>

        {/* SECTION 3: Advanced Details & Custom Checker (Folded by default for clean UX) */}
        <div className="rounded-[28px] bg-white/[0.02] border border-white/5 overflow-hidden transition-all">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center space-x-2">
              <SlidersHorizontal size={14} className="text-zinc-400" />
              <span className="font-semibold tracking-tight text-zinc-300">
                {t.advancedTitle}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/10">
                {t.advancedBadge}
              </span>
            </div>
            {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isAdvancedOpen && (
            <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/5 text-xs animate-fade-in">
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                {t.advancedDesc}
              </p>

              {/* Custom Address Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customAddressQuery}
                    onChange={(e) => setCustomAddressQuery(e.target.value)}
                    placeholder={t.customCheckPlaceholder}
                    className="w-full pl-3 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <button
                  onClick={handleCustomAddressCheck}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                >
                  <Search size={13} />
                  <span>{t.customCheckBtn}</span>
                </button>
              </div>

              {/* Custom Address Inspection Result Card */}
              {customAddressResult && (
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={13} />
                      <span>{t.secPassLabel}</span>
                    </span>
                    <span>{t.readyStatus}</span>
                  </div>
                  <div className="space-y-1 text-zinc-400">
                    <div>{t.addressLabel}: <span className="text-zinc-200">{customAddressResult.address}</span></div>
                    <div>{t.rpcPingLabel}: <span className="text-emerald-300">{customAddressResult.rpcLatency}</span></div>
                    <div>{t.codeHashLabel}: <span className="text-zinc-300">{customAddressResult.codeHash}</span></div>
                    <div>{t.sanctionLabel}: <span className="text-emerald-400">{t.sanctionClear}</span></div>
                  </div>
                </div>
              )}

              {/* Technical Raw Logs Accordion Inner */}
              <div className="pt-2 border-t border-white/5 space-y-1 text-[10px] font-mono text-zinc-500">
                <div>• Smart Account: {userAddress}</div>
                <div>• Network: Base L2 Mainnet (Chain ID 8453)</div>
                <div>• Account Abstraction: ERC-4337 UserOperation Sponsored by Paymaster</div>
                <div>• Orchestration Protocol: Tive AI Zero-Key Liaison Specification</div>
                <div>• Payment Backend: {t.paymentBackendLabel}</div>
              </div>
            </div>
          )}
        </div>

      </div>
      )}

      {/* Audit Log / Cloudflare Tunnel Resources Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101014] border border-zinc-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <TablerButterfly size={18} className="text-pink-400" />
                <span className="font-bold text-white">{t.modalTitle}</span>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[11px] text-zinc-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1.5">
                <div className="text-pink-300 font-semibold flex items-center gap-1.5">
                  <TablerButterfly size={13} />
                  <span>{t.modalSeparationTitle}</span>
                </div>
                <p className="whitespace-pre-line text-zinc-300">
                  {t.modalSeparationText}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1.5">
                <div className="text-pink-300 font-semibold flex items-center gap-1.5">
                  <Network size={13} />
                  <span>{t.modalDockerTitle}</span>
                </div>
                <p className="whitespace-pre-line text-zinc-300">
                  {t.modalDockerText}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[10px] text-zinc-400 font-mono">
                <div>[audit_log] 2026-09-14T19:15:30Z HASH_CHAIN_HEAD: 0x8a92f...41e</div>
                <div>[tunnel_route] cloudflared -&gt; localhost:8090 (Ollama:11434 BLOCKED)</div>
                <div>[backend_handoff] target: {t.paymentBackendLabel} (verified)</div>
              </div>
            </div>

            <button
              onClick={() => setShowAuditModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* WebAuthn Biometric Authentication Modal for Tier 4 / Tier 5 */}
      <BiometricAuthModal
        isOpen={Boolean(biometricModalAction)}
        action={biometricModalAction}
        onClose={() => setBiometricModalAction(null)}
        onSuccess={async (act, authResult) => {
          await onApproveAction(act.id, false, authResult);
          setSlideConfirmedMap(prev => ({ ...prev, [act.id]: true }));
          const confirmMsg: Message = {
            id: `m-${Date.now()}`,
            sender: 'assistant',
            content: `${t.confirmExecutionText(act.desc)} (WebAuthn Passkey Biometrics Verified)`,
            metadata: '142 tok/s · ctx 8192 · WebAuthn FIDO2 Biometric Verified',
          };
          setMessages(prev => [...prev, confirmMsg]);
        }}
        userAddress={userAddress}
      />

      {/* Gemini Live API Voice Modal */}
      <TiveLiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        onConfirmProposal={(prop) => {
          const confirmMsg: Message = {
            id: `m-live-${Date.now()}`,
            sender: 'assistant',
            content: `【Live Voice承認】${prop.destination} への ${prop.amountLabel} の決済提案を承認しました。`,
            metadata: 'Gemini Live (gemini-3.8-live) · 24kHz Audio · Policy Engine Verified',
            actionProposal: {
              destination: prop.destination,
              amountLabel: prop.amountLabel,
              reason: prop.reason,
              whyApprovalNeeded: prop.whyApprovalNeeded,
            },
          };
          setMessages(prev => [...prev, confirmMsg]);
        }}
        userAddress={userAddress}
      />
    </div>
  );
};

