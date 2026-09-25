import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ArrowUp, 
  Mic, 
  MicOff, 
  Compass, 
  MapPin, 
  FileText, 
  Sparkles, 
  Shield, 
  Volume2, 
  Check, 
  Radio, 
  X,
  ExternalLink,
  ChevronRight,
  Layers
} from 'lucide-react';
import { InvisibleAction } from '../types.ts';
import { SlideToConfirm } from './SlideToConfirm.tsx';
import { WebSpeechRecognizer, isSpeechRecognitionSupported, parseVoiceCommandWithGemini } from '../services/webSpeechService.ts';

interface TiveVisionViewProps {
  onAddAction?: (action: InvisibleAction) => void;
  onOpenLiveVoice?: () => void;
  onOpenObservingSession?: () => void;
  onOpenChatThread?: () => void;
  userAddress?: string;
  className?: string;
}

export const TiveVisionView: React.FC<TiveVisionViewProps> = ({
  onAddAction,
  onOpenLiveVoice,
  onOpenObservingSession,
  onOpenChatThread,
  userAddress = '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01',
  className = '',
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessingGemini, setIsProcessingGemini] = useState(false);
  const [createdAction, setCreatedAction] = useState<InvisibleAction | null>(null);
  const [activeModal, setActiveModal] = useState<'discovery' | 'aimap' | 'memo' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognizerRef = useRef<WebSpeechRecognizer | null>(null);

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());

    recognizerRef.current = new WebSpeechRecognizer({
      lang: 'ja-JP',
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsListening(true);
        setErrorMessage(null);
      },
      onResult: (currentText, isFinal) => {
        setTranscript(currentText);
        if (isFinal && currentText.trim()) {
          handleProcessVoiceCommand(currentText.trim());
        }
      },
      onError: (err) => {
        console.warn('Web Speech error:', err);
        setIsListening(false);
        if (err === 'not-allowed') {
          setErrorMessage('マイクへのアクセスが許可されていません。ブラウザ設定を確認してください。');
        } else if (err !== 'no-speech') {
          setErrorMessage(`音声認識エラー: ${err}`);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    return () => {
      recognizerRef.current?.abort();
    };
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setCreatedAction(null);
      setErrorMessage(null);
      const started = recognizerRef.current?.start();
      if (!started && !speechSupported) {
        setErrorMessage('このブラウザはWeb Speech APIに対応していません。テキスト入力をご利用ください。');
      }
    }
  };

  const handleProcessVoiceCommand = async (command: string) => {
    if (!command.trim()) return;
    setIsProcessingGemini(true);
    setErrorMessage(null);

    try {
      const res = await parseVoiceCommandWithGemini(command, userAddress, 'ja');
      if (res.action) {
        setCreatedAction(res.action);
        if (onAddAction) {
          onAddAction(res.action);
        }
      }
    } catch (err: any) {
      console.error('Failed to parse with Gemini:', err);
      setErrorMessage('Gemini解析エラーが発生しました。再度お話しください。');
    } finally {
      setIsProcessingGemini(false);
    }
  };

  const handleSubmitText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    setTranscript(text);
    handleProcessVoiceCommand(text);
  };

  return (
    <div className={`relative flex flex-col items-center justify-between min-h-[580px] max-w-md mx-auto text-white select-none px-2 py-3 ${className}`}>
      
      {/* Top Title Bar (Matching "AIM Tive AI" in IMG_0475.jpeg) */}
      <div className="w-full flex items-center justify-between text-xs text-zinc-400 pt-1 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-white font-extrabold text-sm tracking-tight flex items-center gap-1">
            AIM Tive AI
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            edge-privacy
          </span>
        </div>
      </div>

      {/* Main Hero Header: Ask Me Anything (Matching IMG_0475.jpeg) */}
      <div className="text-center space-y-2.5 pt-2 max-w-sm">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
          Ask Me Anything
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed font-normal px-2">
          Tap the Tive to start a communication. I can discover the web, find places, or save your Memo and Notebook.
        </p>
      </div>

      {/* Center Vision Radar Orb Interface (Matching IMG_0475.jpeg) */}
      <div className="relative my-6 flex flex-col items-center justify-center">
        {/* Outer Circular Radar Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          
          {/* Top Arc "V I S I O N" Tracked Label */}
          <div className="absolute top-2 z-20 text-[10px] font-mono tracking-[0.35em] text-zinc-400 font-bold uppercase select-none">
            V I S I O N
          </div>

          {/* Outer dashed radar ring */}
          <div className={`absolute inset-0 rounded-full border border-dashed border-zinc-700/60 ${
            isListening ? 'border-emerald-500/60 animate-spin-slow' : 'border-zinc-700/50'
          }`} />

          {/* Concentric middle radar ring */}
          <div className="absolute inset-4 rounded-full border border-zinc-800/80" />
          
          {/* Floating Orbital Dots / Particles */}
          <span className="absolute top-10 left-12 w-1.5 h-1.5 rounded-full bg-zinc-400/80 animate-ping" style={{ animationDuration: '3s' }} />
          <span className="absolute bottom-12 right-14 w-1 h-1 rounded-full bg-cyan-300/80" />
          <span className="absolute top-20 right-10 w-1 h-1 rounded-full bg-zinc-500" />
          <span className="absolute bottom-20 left-10 w-1.5 h-1.5 rounded-full bg-blue-400/60" />

          {/* Inner radar ring with subtle gradient */}
          <div className="absolute inset-10 rounded-full border border-zinc-800/90 bg-radial from-zinc-900/60 via-zinc-950/80 to-transparent backdrop-blur-xs" />

          {/* Center Glowing Tive Core / Orb (Tap to speak or start voice!) */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`relative z-20 group flex flex-col items-center justify-center transition-all duration-300 active:scale-95 focus:outline-hidden ${
              isListening ? 'scale-105' : 'hover:scale-102'
            }`}
            title="Tap to speak with Tive ◉AI"
          >
            {/* Glowing Aura */}
            <div className={`absolute w-20 h-20 rounded-full filter blur-xl transition-all duration-500 pointer-events-none ${
              isListening 
                ? 'bg-emerald-400/40 scale-150 animate-pulse' 
                : isProcessingGemini 
                ? 'bg-blue-500/40 scale-125 animate-ping' 
                : 'bg-white/20 group-hover:bg-cyan-400/30'
            }`} />

            {/* Central Pure White / Opal Glowing Orb */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative ${
              isListening 
                ? 'bg-radial from-emerald-100 via-emerald-300 to-teal-500 ring-4 ring-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                : isProcessingGemini
                ? 'bg-radial from-blue-100 via-blue-300 to-indigo-500 ring-4 ring-blue-400/30 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
                : 'bg-radial from-white via-zinc-200 to-zinc-400 ring-2 ring-white/20 group-hover:ring-white/50 shadow-[0_0_24px_rgba(255,255,255,0.4)]'
            }`}>
              {isListening ? (
                <Mic size={22} className="text-zinc-950 animate-bounce" />
              ) : isProcessingGemini ? (
                <Sparkles size={20} className="text-zinc-950 animate-spin" />
              ) : (
                <span className="text-zinc-900 font-extrabold text-xl leading-none select-none">◉</span>
              )}
            </div>

            {/* Quote text under orb: "Complete privacy through edge..." */}
            <div className="mt-3.5 text-center px-2">
              <p className="text-[11px] text-zinc-300 font-serif italic tracking-wide">
                &ldquo;Complete privacy through edge...&rdquo;
              </p>
              
              {/* Blue Neon Glow Capsule Bar (Matching IMG_0475.jpeg) */}
              <div className="mt-1.5 mx-auto w-7 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
            </div>
          </button>
        </div>

        {/* Real-time Status / Transcript Notification */}
        {isListening && (
          <div className="mt-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono flex items-center space-x-1.5 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Listening... お話しください</span>
          </div>
        )}

        {isProcessingGemini && (
          <div className="mt-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-mono flex items-center space-x-1.5 animate-pulse">
            <Sparkles size={11} className="animate-spin" />
            <span>Gemini API 解析中 (gemini-3.8-flash)...</span>
          </div>
        )}

        {transcript && !isProcessingGemini && (
          <div className="mt-2 max-w-xs text-center text-xs text-zinc-300 font-medium px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
            &ldquo;{transcript}&rdquo;
          </div>
        )}

        {errorMessage && (
          <div className="mt-2 text-center text-[11px] text-rose-400 px-3 py-1 rounded-xl bg-rose-950/40 border border-rose-800/60 max-w-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Generated Action Card Overlay (if voice command was processed into an InvisibleAction) */}
      {createdAction && (
        <div className="w-full max-w-sm mb-3 p-4 rounded-3xl bg-zinc-900/95 border border-emerald-500/40 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
              <Check size={14} />
              <span>Voice Action Created (Tier {createdAction.tier})</span>
            </div>
            <button
              onClick={() => setCreatedAction(null)}
              className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>

          <div className="bg-black/60 rounded-2xl p-3 border border-zinc-800 space-y-1.5">
            <div className="text-xs text-zinc-400">送金・決済先:</div>
            <div className="text-sm font-bold text-white font-mono">{createdAction.destination}</div>
            <div className="text-lg font-extrabold text-white mt-1">{createdAction.amountLabel || createdAction.amount}</div>
            <div className="text-[11px] text-zinc-300">{createdAction.reason}</div>
            <div className="text-[10px] text-amber-300/90 font-mono pt-1">
              {createdAction.whyApprovalNeeded}
            </div>
          </div>

          <SlideToConfirm
            label={`スライドして承認 (${createdAction.amount})`}
            color="emerald"
            onConfirm={() => {
              setCreatedAction(null);
            }}
          />
        </div>
      )}

      {/* Three Bottom Navigation Icons: DISCOVERY, AIMAP, MEMO (Matching IMG_0475.jpeg) */}
      <div className="w-full flex items-center justify-around max-w-xs pt-1 pb-3 text-zinc-400">
        
        {/* DISCOVERY */}
        <button
          type="button"
          onClick={() => setActiveModal('discovery')}
          className="flex flex-col items-center space-y-1.5 group transition-colors hover:text-white"
        >
          <div className="w-9 h-9 rounded-full bg-zinc-900/90 border border-zinc-800 group-hover:border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all shadow-xs">
            <Compass size={17} className="group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <span className="text-[10px] font-mono tracking-wider font-bold">DISCOVERY</span>
        </button>

        {/* AIMAP */}
        <button
          type="button"
          onClick={() => setActiveModal('aimap')}
          className="flex flex-col items-center space-y-1.5 group transition-colors hover:text-white"
        >
          <div className="w-9 h-9 rounded-full bg-zinc-900/90 border border-zinc-800 group-hover:border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all shadow-xs">
            <MapPin size={17} className="group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[10px] font-mono tracking-wider font-bold">AIMAP</span>
        </button>

        {/* MEMO */}
        <button
          type="button"
          onClick={() => setActiveModal('memo')}
          className="flex flex-col items-center space-y-1.5 group transition-colors hover:text-white"
        >
          <div className="w-9 h-9 rounded-full bg-zinc-900/90 border border-zinc-800 group-hover:border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all shadow-xs">
            <FileText size={17} className="group-hover:translate-y-[-1px] transition-transform" />
          </div>
          <span className="text-[10px] font-mono tracking-wider font-bold">MEMO</span>
        </button>
      </div>

      {/* Bottom Pill Input Bar: "+" on left, "Ask Tive◉AI anything", mic/send on right (Matching IMG_0475.jpeg) */}
      <form
        onSubmit={handleSubmitText}
        className="w-full max-w-sm flex items-center bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 rounded-full px-3.5 py-2 shadow-2xl transition-all focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600"
      >
        {/* Plus Button */}
        <button
          type="button"
          onClick={onOpenLiveVoice}
          className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors shrink-0"
          title="Start Live Voice API Session"
        >
          <Plus size={16} />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Tive◉AI anything"
          className="flex-1 bg-transparent px-3 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden font-sans"
        />

        {/* Microphone / Send Button */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-emerald-500 text-black animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
            }`}
            title={isListening ? 'Stop listening' : 'Speak with Web Speech API'}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          {inputText.trim() && (
            <button
              type="submit"
              className="w-7 h-7 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-colors shadow-xs"
              title="Send"
            >
              <ArrowUp size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Quick Drawer Modals for DISCOVERY / AIMAP / MEMO */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121216] border border-zinc-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                {activeModal === 'discovery' && <Compass size={18} className="text-cyan-400" />}
                {activeModal === 'aimap' && <MapPin size={18} className="text-emerald-400" />}
                {activeModal === 'memo' && <FileText size={18} className="text-amber-400" />}
                <span className="uppercase tracking-wider font-mono">{activeModal}</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {activeModal === 'discovery' && (
              <div className="space-y-3 text-xs text-zinc-300">
                <p className="text-zinc-400">
                  Tive ◉AI Autonomous Web &amp; On-chain Discovery:
                </p>
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <div className="font-bold text-white">x402 Discovered APIs</div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      api.market.ai, nlp.vibe.io, img.dream.net
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <div className="font-bold text-white">Autonomous Agent DID</div>
                    <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                      did:awallet:agent:amy_01
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'aimap' && (
              <div className="space-y-3 text-xs text-zinc-300">
                <p className="text-zinc-400">
                  Physical POS &amp; Agent Routing Locations:
                </p>
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">Blue Bottle Coffee Roastery</div>
                      <div className="text-[11px] text-zinc-400">Tier 2 POS Micro-Checkout (¥480)</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Active</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">Regulated Power Exchange</div>
                      <div className="text-[11px] text-zinc-400">JEPX Electricity Strategy Hub</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Tier 5</span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'memo' && (
              <div className="space-y-3 text-xs text-zinc-300">
                <p className="text-zinc-400">
                  Encrypted Notebook &amp; Audit Trail:
                </p>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 font-mono text-[11px] space-y-1">
                  <div className="text-zinc-400">[0x8453] Session started: takumi</div>
                  <div className="text-emerald-400">[policy] Edge rule verification: pass</div>
                  <div className="text-zinc-400">[vault] Ephemeral grant token: active (TTL 300s)</div>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
