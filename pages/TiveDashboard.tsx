import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Cpu,
  Building2,
  Globe,
  Clock,
  Sparkles,
  Camera,
  Mic,
  MicOff,
  Check,
  Radio,
  AlertCircle,
  ArrowRight,
  Loader2,
  Volume2
} from 'lucide-react';
import { DICTIONARY, Locale } from '../services/tiveI18n';
import { InvisibleAction } from '../types';
import { SlideToConfirm } from '../components/SlideToConfirm';
import { 
  WebSpeechRecognizer, 
  isSpeechRecognitionSupported, 
  parseVoiceCommandWithGemini 
} from '../services/webSpeechService';

interface TiveDashboardProps {
  onBack: () => void;
  onOpenInvisibleFinance?: () => void;
  onOpenProposalScanner?: () => void;
  onAddInvisibleAction?: (action: InvisibleAction) => void;
  userAddress?: string;
}

type MarketSentiment = {
  emoji: string;
  label: string;
  level: string;
  volatility: string;
  color: string;
  apy: string;
};

const SENTIMENTS: MarketSentiment[] = [
  { emoji: '👑', label: 'Bull Dominance', level: 'Alpha', volatility: 'Low-Med', color: 'text-amber-300', apy: '14.2%' },
  { emoji: '⚖️', label: 'Balanced Equilibrium', level: 'Stable', volatility: 'Moderate', color: 'text-purple-300', apy: '12.5%' },
  { emoji: '👜', label: 'Accumulation', level: 'Consolidation', volatility: 'Low', color: 'text-emerald-300', apy: '11.8%' },
  { emoji: '🏺', label: 'Defensive', level: 'Caution', volatility: 'Elevated', color: 'text-blue-300', apy: '9.4%' },
  { emoji: '📉', label: 'Hedging', level: 'Stress', volatility: 'Extreme', color: 'text-rose-300', apy: '7.6%' }
];

export const TiveDashboard: React.FC<TiveDashboardProps> = ({ 
  onBack,
  onOpenInvisibleFinance,
  onOpenProposalScanner,
  onAddInvisibleAction,
  userAddress = '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01'
}) => {
  const [locale, setLocale] = useState<Locale>('en');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'multiasset' | 'liaison' | 'automl'>('dashboard');
  const [sentimentIndex, setSentimentIndex] = useState<number>(1); // Default: ⚖️ Balanced

  // Web Speech API & Gemini Natural Language Action states
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isGeminiParsing, setIsGeminiParsing] = useState(false);
  const [generatedAction, setGeneratedAction] = useState<InvisibleAction | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognizerRef = useRef<WebSpeechRecognizer | null>(null);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());

    recognizerRef.current = new WebSpeechRecognizer({
      lang: locale === 'ja' ? 'ja-JP' : 'en-US',
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsListening(true);
        setSpeechError(null);
        setToastMessage(null);
      },
      onResult: (text, isFinal) => {
        setSpeechTranscript(text);
        if (isFinal && text.trim()) {
          handleExecuteGeminiParse(text.trim());
        }
      },
      onError: (err) => {
        console.warn('[TiveDashboard] Web Speech error:', err);
        setIsListening(false);
        if (err === 'not-allowed') {
          setSpeechError(locale === 'ja' ? 'マイクの使用が拒否されました' : 'Microphone permission denied');
        } else if (err !== 'no-speech') {
          setSpeechError(`${err}`);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    return () => {
      recognizerRef.current?.abort();
    };
  }, [locale]);

  const handleToggleMic = () => {
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      setSpeechTranscript('');
      setGeneratedAction(null);
      setSpeechError(null);
      const started = recognizerRef.current?.start();
      if (!started && !isSupported) {
        setSpeechError(locale === 'ja' ? 'Web Speech API非対応ブラウザです' : 'Web Speech API not supported');
      }
    }
  };

  const handleExecuteGeminiParse = async (command: string) => {
    if (!command.trim()) return;
    setIsGeminiParsing(true);
    setSpeechError(null);

    try {
      const result = await parseVoiceCommandWithGemini(command, userAddress, locale);
      if (result.action) {
        setGeneratedAction(result.action);
        if (onAddInvisibleAction) {
          onAddInvisibleAction(result.action);
        }
        setToastMessage(locale === 'ja' ? 'GeminiがInvisibleActionを生成しました' : 'Gemini created structured InvisibleAction');
      }
    } catch (err: any) {
      console.error('[TiveDashboard] Gemini voice parse error:', err);
      setSpeechError(err.message || 'Gemini API call failed');
    } finally {
      setIsGeminiParsing(false);
    }
  };

  const t = DICTIONARY[locale];
  const currentSentiment = SENTIMENTS[sentimentIndex];

  // Actual verified state: 5,000 JPY ≒ 35.42 USDC
  const balanceJpy = 5000;
  const balanceUsdc = 35.42;
  const todayYieldJpy = 12.5;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 sm:p-6 font-sans relative overflow-hidden pb-24 animate-fade-in">
      {/* Subtle ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/15 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Top bar: Back, Title in English, Language Switcher */}
        <div className="flex justify-between items-center mb-6 pt-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 border border-white/10 backdrop-blur-md transition-colors flex items-center space-x-1"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-medium pr-1">{t.walletBack}</span>
          </button>

          <div className="flex items-center space-x-2">
            {onOpenProposalScanner && (
              <button
                type="button"
                onClick={onOpenProposalScanner}
                className="px-2.5 py-1 rounded-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-[11px] font-mono text-blue-200 hover:text-white flex items-center space-x-1 transition-all shadow-xs"
                title="Scan Proposal QR"
              >
                <Camera size={11} className="text-blue-300" />
                <span>QR Scan</span>
              </button>
            )}

            {/* Simple Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-white flex items-center space-x-1"
              title="Toggle Language"
            >
              <Globe size={11} className="text-zinc-400" />
              <span>{locale === 'ja' ? 'EN' : 'JA'}</span>
            </button>

            {/* Header Title: AI Asset Management */}
            <div className="px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs text-zinc-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-medium tracking-tight">{t.headerTitle}</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs: English Clean Labels */}
        <div className="flex items-center justify-between p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.tabSummary}
          </button>
          <button
            onClick={() => setActiveTab('multiasset')}
            className={`flex-1 py-1.5 rounded-xl font-medium transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'multiasset'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 size={11} className="text-amber-400" />
            <span>{t.tabMultiAsset}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono ml-0.5">
              Pending
            </span>
          </button>
          <button
            onClick={() => setActiveTab('liaison')}
            className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'liaison'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.tabButterfly}
          </button>
          <button
            onClick={() => setActiveTab('automl')}
            className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'automl'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.tabAutoML}
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Total Balance Card */}
            <div className="text-center py-6 px-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-xl">
              <div className="flex items-center justify-center space-x-2">
                <p className="text-xs text-zinc-400">{t.totalAssets}</p>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                  {t.implementedBadge}
                </span>
              </div>
              <h2 className="text-4xl font-light tracking-tight mt-2 text-white font-mono">
                ¥{balanceJpy.toLocaleString()}
              </h2>
              <p className="text-emerald-400 text-xs mt-2.5 font-medium flex items-center justify-center gap-1.5 font-mono">
                <TrendingUp size={13} className="mr-0.5" />
                <span>+¥{todayYieldJpy} ({t.todayYield})</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-300">{t.targetApy}: 12.5%</span>
              </p>
            </div>

            {/* Tive Natural Language Voice Command Center (Web Speech API + Gemini) */}
            <div className="p-5 rounded-3xl bg-linear-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800/90 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 text-xs font-bold font-mono">
                    ◉
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                      <span>Tive ◉AI Voice Actions</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                        Web Speech &middot; Gemini
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      {locale === 'ja'
                        ? '自然言語の音声指示をGeminiが構造化InvisibleActionへ自動変換'
                        : 'Web Speech captures natural language, Gemini converts to InvisibleAction'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Microphone Action Container */}
              <div className="flex flex-col items-center justify-center py-2 space-y-3">
                <div className="relative flex items-center justify-center">
                  {/* Outer Pulsing Glow while listening */}
                  <div
                    className={`absolute w-20 h-20 rounded-full transition-all duration-300 filter blur-md ${
                      isListening
                        ? 'bg-pink-500/50 scale-125 animate-ping'
                        : isGeminiParsing
                        ? 'bg-blue-500/40 scale-110 animate-pulse'
                        : 'bg-zinc-800/40'
                    }`}
                  />

                  {/* Primary Microphone Button */}
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl active:scale-95 ${
                      isListening
                        ? 'bg-linear-to-tr from-pink-500 to-rose-400 text-white ring-4 ring-pink-500/30 scale-105'
                        : isGeminiParsing
                        ? 'bg-linear-to-tr from-blue-600 to-cyan-400 text-white ring-4 ring-blue-500/30 animate-pulse'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start microphone'}
                  >
                    {isListening ? (
                      <MicOff size={26} className="animate-bounce" />
                    ) : isGeminiParsing ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Mic size={26} />
                    )}
                  </button>
                </div>

                {/* Status Indicator / Waveform */}
                <div className="text-center space-y-1">
                  {isListening ? (
                    <div className="flex flex-col items-center space-y-1.5 animate-fade-in">
                      {/* Audio waveform simulator */}
                      <div className="flex items-center space-x-1 h-4">
                        <span className="w-1 bg-pink-400 rounded-full h-3 animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <span className="w-1 bg-pink-400 rounded-full h-4 animate-pulse" style={{ animationDelay: '0.25s' }} />
                        <span className="w-1 bg-pink-300 rounded-full h-2 animate-pulse" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1 bg-pink-400 rounded-full h-4 animate-pulse" style={{ animationDelay: '0.35s' }} />
                        <span className="w-1 bg-pink-400 rounded-full h-2.5 animate-pulse" style={{ animationDelay: '0.05s' }} />
                      </div>
                      <span className="text-xs text-pink-300 font-medium">
                        {locale === 'ja' ? '音声を聴き取っています...' : 'Listening to your voice...'}
                      </span>
                    </div>
                  ) : isGeminiParsing ? (
                    <div className="flex items-center space-x-1.5 text-xs text-blue-300 font-mono">
                      <Sparkles size={13} className="animate-spin" />
                      <span>Gemini API (gemini-3.8-flash) 解析中...</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-400">
                      {locale === 'ja' ? 'マイクをタップして指示してください' : 'Tap mic to speak your intent'}
                    </span>
                  )}

                  {/* Transcript output box */}
                  {speechTranscript && (
                    <div className="mt-1 px-3 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-xs text-zinc-200 font-medium max-w-xs text-center font-mono">
                      &ldquo;{speechTranscript}&rdquo;
                    </div>
                  )}

                  {speechError && (
                    <div className="mt-1 px-3 py-1 rounded-xl bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-300 flex items-center justify-center space-x-1">
                      <AlertCircle size={12} />
                      <span>{speechError}</span>
                    </div>
                  )}

                  {toastMessage && (
                    <div className="mt-1 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300 flex items-center justify-center space-x-1">
                      <Check size={12} />
                      <span>{toastMessage}</span>
                    </div>
                  )}
                </div>

                {/* Sample Command Quick Chips */}
                <div className="w-full pt-1">
                  <div className="text-[10px] text-zinc-500 mb-1.5 text-center font-mono">
                    {locale === 'ja' ? 'ワンタップでお試し音声指示:' : 'Quick voice command samples:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const cmd = locale === 'ja' ? 'スタバで650円のコーヒーを決済して' : 'Pay $4.50 for coffee at Starbucks';
                        setSpeechTranscript(cmd);
                        handleExecuteGeminiParse(cmd);
                      }}
                      className="px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 hover:text-white border border-zinc-700 transition-colors flex items-center space-x-1"
                    >
                      <span>☕</span>
                      <span>{locale === 'ja' ? 'カフェ決済 ¥650' : 'Cafe ¥650'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cmd = locale === 'ja' ? 'JEPXスポット電力連動型変動ポジションに30万円配分' : 'Allocate 300,000 JPY to JEPX power strategy';
                        setSpeechTranscript(cmd);
                        handleExecuteGeminiParse(cmd);
                      }}
                      className="px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 hover:text-white border border-zinc-700 transition-colors flex items-center space-x-1"
                    >
                      <span>⚡</span>
                      <span>{locale === 'ja' ? 'JEPX電力枠 (Tier 5)' : 'Power STO (Tier 5)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cmd = locale === 'ja' ? '自律AIエージェントに25 USDC送金して' : 'Transfer 25 USDC to autonomous agent';
                        setSpeechTranscript(cmd);
                        handleExecuteGeminiParse(cmd);
                      }}
                      className="px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 hover:text-white border border-zinc-700 transition-colors flex items-center space-x-1"
                    >
                      <span>🤖</span>
                      <span>{locale === 'ja' ? 'Agent送金 25 USDC' : 'Agent 25 USDC'}</span>
                    </button>
                  </div>
                </div>

                {/* Generated Structured InvisibleAction Preview */}
                {generatedAction && (
                  <div className="w-full mt-3 p-3.5 rounded-2xl bg-black/80 border border-emerald-500/40 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Tier {generatedAction.tier} &middot; {generatedAction.category || 'Payment'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Status: Awaiting</span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white">{generatedAction.desc}</div>
                      <div className="text-lg font-extrabold text-white font-mono mt-0.5">
                        {generatedAction.amountLabel || generatedAction.amount}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        送金・決済先: <span className="text-zinc-200 font-mono">{generatedAction.destination}</span>
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-1">
                        {generatedAction.reason}
                      </div>
                      <div className="text-[10px] text-amber-300/90 font-mono mt-1">
                        {generatedAction.whyApprovalNeeded}
                      </div>
                    </div>

                    <div className="pt-1">
                      <SlideToConfirm
                        label={`スライドして承認 (${generatedAction.amount})`}
                        color="emerald"
                        onConfirm={() => {
                          setGeneratedAction(null);
                          setToastMessage(locale === 'ja' ? '承認が完了しました' : 'Action approved');
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Cards: USDC (Web3) & Yield */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* USDC Account */}
              <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] p-4 flex flex-col justify-between h-48 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-lg font-semibold tracking-tight">USDC</h3>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                        Web3
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{t.usdcDesc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    {t.implementedBadge}
                  </span>
                </div>

                <div className="py-2">
                  <svg viewBox="0 0 100 28" className="w-full h-8 overflow-visible">
                    <path
                      d="M0,22 C25,20 50,16 75,12 100,8"
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle cx="100" cy="8" r="2.5" fill="#34d399" />
                  </svg>
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-[10px] font-bold">
                    $
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-base font-medium">{balanceUsdc}</p>
                    <p className="text-[11px] text-zinc-400">¥{balanceJpy.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Yield Card */}
              <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] p-4 flex flex-col justify-between h-48 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-lg font-semibold text-purple-100 tracking-tight">{t.yieldAccount}</h3>
                      <span className="text-base">{currentSentiment.emoji}</span>
                    </div>
                    <p className="text-[11px] text-purple-300/60 mt-0.5">{t.yieldDesc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
                    AI
                  </span>
                </div>

                {/* Micro indicators */}
                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>Liaison Node</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-[9px] font-bold font-mono">
                    AI
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1 font-mono">
                      <span>{currentSentiment.emoji}</span>
                      <span className="text-base font-medium text-purple-100">{currentSentiment.apy}</span>
                    </div>
                    <p className="text-[10px] text-purple-300/60 font-mono">
                      {currentSentiment.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Sentiment Selector */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">{currentSentiment.emoji}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">{t.sentimentTitle}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 ${currentSentiment.color}`}>
                      {currentSentiment.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {t.sentimentSubtitle}: {currentSentiment.volatility}
                  </p>
                </div>
              </div>

              {/* Sentiment Carousel */}
              <div className="flex items-center gap-1">
                {SENTIMENTS.map((s, idx) => (
                  <button
                    key={s.emoji}
                    onClick={() => setSentimentIndex(idx)}
                    title={`${s.emoji} ${s.label}`}
                    className={`w-7 h-7 rounded-xl text-xs flex items-center justify-center transition-all ${
                      idx === sentimentIndex
                        ? 'bg-purple-500/30 border border-purple-400 text-white scale-110 shadow'
                        : 'bg-white/5 hover:bg-white/10 border border-white/5 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Multi-Asset CFD (Pending) */}
        {activeTab === 'multiasset' && (
          <div className="space-y-4 text-xs leading-relaxed animate-fade-in">
            {/* Clear Status Notice Card */}
            <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-lg font-bold">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{t.multiAssetCfdTitle}</h3>
                <span className="inline-block mt-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300">
                  {t.multiAssetCfdStatusPending}
                </span>
              </div>
              <p className="text-zinc-300 text-xs max-w-xs mx-auto">
                {t.multiAssetCfdDesc}
              </p>
            </div>

            {/* Status Checklist */}
            <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
              <h4 className="font-semibold text-zinc-300 flex items-center space-x-1.5">
                <Clock size={14} className="text-amber-400" />
                <span>Integration Status</span>
              </h4>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🪙</span>
                    <div>
                      <p className="font-medium text-white">USDC Web3 Vault</p>
                      <p className="text-[10px] text-zinc-500 font-mono">Base / EVM On-chain</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded-full">
                    {t.implementedBadge}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🏛️</span>
                    <div>
                      <p className="font-medium text-zinc-300">TradFi CFD (Indices &amp; Commodities)</p>
                      <p className="text-[10px] text-zinc-500 font-mono">OAuth2 / Broker API</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800 px-2 py-0.5 rounded-full">
                    {t.pendingBadge}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">⚡</span>
                    <div>
                      <p className="font-medium text-zinc-300">Crypto Exchange API (CEX / CeFi)</p>
                      <p className="text-[10px] text-zinc-500 font-mono">Liquidity &amp; Custody API</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800 px-2 py-0.5 rounded-full">
                    {t.pendingBadge}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed">
                {t.multiAssetCfdNotice}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Butterfly Effect Liaison */}
        {activeTab === 'liaison' && (
          <div className="space-y-4 text-xs leading-relaxed animate-fade-in">
            <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-base">🦋</span>
                <h3 className="text-sm font-semibold text-white">{t.butterflyTitle}</h3>
              </div>
              <p className="text-zinc-300">
                {t.butterflyDesc}
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
              <h4 className="font-semibold text-purple-400 flex items-center space-x-1.5">
                <Sparkles size={14} />
                <span>Spirit of WA</span>
              </h4>
              <p className="text-zinc-300">
                The four core dimensions: Connection (輪), Harmony (和), Dialogue (話), and Circular Environment (環).
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Butterfly Effect AutoML Engine */}
        {activeTab === 'automl' && (
          <div className="space-y-4 text-xs leading-relaxed animate-fade-in">
            <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu size={16} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">{t.autoMlTitle}</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  {t.autoMlStatus}
                </span>
              </div>
              <p className="text-zinc-300">
                {t.autoMlDesc}
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-black/60 border border-white/10 space-y-2.5">
              <p className="font-semibold text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
                Key Defense &amp; Audit Specifications
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start space-x-2">
                  <span className="text-emerald-400 text-xs">⚡</span>
                  <div>
                    <span className="text-white font-medium">Circuit Breaker:</span>
                    <span className="text-zinc-400 ml-1">Colony size &le; 200, max iter &le; 1,000, max seconds timeout safe cutoff.</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start space-x-2">
                  <span className="text-blue-400 text-xs">🛡️</span>
                  <div>
                    <span className="text-white font-medium">Input Defense:</span>
                    <span className="text-zinc-400 ml-1">Symlink rejection before resolve, 500MB size limit, path traversal defense.</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start space-x-2">
                  <span className="text-purple-400 text-xs">🔗</span>
                  <div>
                    <span className="text-white font-medium">Tamper-Evident Log:</span>
                    <span className="text-zinc-400 ml-1">SHA-256 hash-chained JSON Lines audit log (`butterfly_audit.log`).</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variable Return Schema Specs */}
            <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
                  `inbox/investment/` Feature Schema
                </p>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                  Variable Return Only
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-emerald-400 font-semibold">spot_price_*</span>
                  <p className="text-zinc-400 text-[10px] mt-0.5">JEPX, Gold (Au), Silver (Ag), CFD indices</p>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-purple-400 font-semibold">volatility_*</span>
                  <p className="text-zinc-400 text-[10px] mt-0.5">Historical &amp; Parkinson realized vol</p>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-blue-400 font-semibold">spread_*</span>
                  <p className="text-zinc-400 text-[10px] mt-0.5">Bid-ask, regional area, basis spreads</p>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-amber-400 font-semibold">macro_*</span>
                  <p className="text-zinc-400 text-[10px] mt-0.5">Policy rates, CPI, USD/JPY FX</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 italic pt-1">
                Notice: Machine-enforced rejection of fixed-yield keywords to guarantee compliance with investment laws.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
