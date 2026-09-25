import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Radio, 
  AlertCircle,
  CheckCircle2,
  Square
} from 'lucide-react';
import { LiveAudioPlayer, LiveAudioRecorder } from '../services/liveAudioService';
import { SlideToConfirm } from './SlideToConfirm';

export interface LiveProposal {
  destination: string;
  amountLabel: string;
  reason: string;
  whyApprovalNeeded: string;
}

interface TiveLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmProposal?: (proposal: LiveProposal) => void;
  onOpenAquaSweep?: () => void;
  userAddress?: string;
}

export const TiveLiveVoiceModal: React.FC<TiveLiveVoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirmProposal,
  onOpenAquaSweep,
  userAddress,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Transcripts
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [modelTranscript, setModelTranscript] = useState<string>('');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);

  // Live Proposals received from function call
  const [currentProposal, setCurrentProposal] = useState<LiveProposal | null>(null);
  const [proposalConfirmed, setProposalConfirmed] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [textCommandInput, setTextCommandInput] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const recorderRef = useRef<LiveAudioRecorder | null>(null);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!isOpen) {
      handleDisconnect();
      return;
    }

    handleConnect();

    return () => {
      handleDisconnect();
    };
  }, [isOpen]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    setUserTranscript('');
    setModelTranscript('');
    setCurrentProposal(null);
    setProposalConfirmed(false);

    try {
      // 1. Initialize Audio Player (24kHz output)
      const player = new LiveAudioPlayer();
      await player.resume();
      playerRef.current = player;

      // 2. Open WebSocket to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsConnecting(false);

        // 3. Initialize Audio Recorder (16kHz input)
        const recorder = new LiveAudioRecorder((base64Chunk) => {
          if (!isMutedRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'audio',
                audio: base64Chunk,
              })
            );
          }
        });

        try {
          await recorder.start();
          recorderRef.current = recorder;
          setMicPermissionDenied(false);
        } catch (micErr: any) {
          console.warn('[LiveAPI] Microphone access denied or unavailable:', micErr?.message || micErr);
          setMicPermissionDenied(true);
          setErrorMsg('マイクへのアクセスが制限されています。下のクイック発話ボタンまたはテキスト入力から対話可能です。');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            console.log('[LiveAPI] Ready with model:', data.model);
          } else if (data.type === 'audio' && data.audio) {
            setIsModelSpeaking(true);
            playerRef.current?.resume();
            playerRef.current?.playChunk(data.audio);
          } else if (data.type === 'interrupted') {
            playerRef.current?.interrupt();
            setIsModelSpeaking(false);
          } else if (data.type === 'output_transcript' && data.text) {
            setIsModelSpeaking(true);
            setModelTranscript((prev) => prev + ' ' + data.text);
          } else if (data.type === 'input_transcript' && data.text) {
            setUserTranscript((prev) => prev + ' ' + data.text);
          } else if (data.type === 'proposal' && data.proposal) {
            setCurrentProposal(data.proposal);
          } else if (data.type === 'sweep_proposal') {
            if (onOpenAquaSweep) {
              onOpenAquaSweep();
            }
          } else if (data.type === 'error') {
            setErrorMsg(data.error);
          }
        } catch (err) {
          console.warn('[LiveAPI] Error parsing message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[LiveAPI] WebSocket event:', err);
        setErrorMsg('Live API connection warning.');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setIsModelSpeaking(false);
      };
    } catch (err) {
      console.warn('[LiveAPI] Connect error:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setIsConnecting(false);
    }
  };

  const handleSendTextCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    setUserTranscript(cmd.trim());
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: cmd.trim() }));
      setTextCommandInput('');
    } else {
      setErrorMsg('Live API接続が未確立です。下の「Reconnect Live」を押してください。');
    }
  };

  const handleDisconnect = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsModelSpeaking(false);
  };

  const handleInterruptSpeaking = () => {
    playerRef.current?.interrupt();
    setIsModelSpeaking(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: '[User interrupted voice]' }));
    }
  };

  const handleConfirmCurrentProposal = () => {
    if (!currentProposal) return;
    setProposalConfirmed(true);
    if (onConfirmProposal) {
      onConfirmProposal(currentProposal);
    }
    setTimeout(() => {
      setCurrentProposal(null);
      setProposalConfirmed(false);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="bg-[#121216] border border-zinc-800 text-zinc-100 rounded-[32px] max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Top Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base leading-none">
              ◉
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>Tive ◉AI Live</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  gemini-3.8-live
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center space-x-1.5 mt-0.5">
                {isConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Bi-directional Voice Stream</span>
                  </>
                ) : isConnecting ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Connecting to Live API...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    <span>Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col items-center justify-between">
          
          {/* Animated Visualizer Orb */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Glowing outer rings */}
            <div
              className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${
                isModelSpeaking
                  ? 'bg-blue-500/20 animate-ping scale-110'
                  : isConnected && !isMuted
                  ? 'bg-emerald-500/15 animate-pulse'
                  : 'bg-zinc-800/20'
              }`}
            />
            <div
              className={`relative w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-500 shadow-2xl ${
                isModelSpeaking
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400 text-white scale-105 shadow-blue-500/30'
                  : isConnected && !isMuted
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400 text-white shadow-emerald-500/30'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              {isModelSpeaking ? (
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-10 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-7 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                </div>
              ) : isConnected && !isMuted ? (
                <div className="text-center space-y-1">
                  <Mic size={32} className="mx-auto text-white animate-pulse" />
                  <span className="text-[10px] font-mono tracking-wider uppercase block text-emerald-200">
                    Listening
                  </span>
                </div>
              ) : (
                <MicOff size={32} className="text-zinc-600" />
              )}
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="w-full p-3 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Connection Notice:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Live Transcript Stream */}
          <div className="w-full space-y-2.5">
            {/* User Input Transcript */}
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Mic size={12} className="text-emerald-400" />
                <span>You (Voice Input · 16kHz PCM)</span>
              </div>
              <p className="text-zinc-200 font-medium min-h-[20px]">
                {userTranscript || <span className="text-zinc-500 italic">話し始めてください（例：「珈琲代480円を送金して」「小額残高をまとめて」）</span>}
              </p>
            </div>

            {/* Model Output Transcript */}
            <div className="p-3.5 rounded-2xl bg-[#171821] border border-blue-900/40 text-xs">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Volume2 size={12} className="text-blue-400" />
                  <span>Tive ◉AI (Live Voice · 24kHz)</span>
                </div>
                {isModelSpeaking && (
                  <button
                    onClick={handleInterruptSpeaking}
                    className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 flex items-center space-x-1"
                  >
                    <Square size={10} className="fill-current" />
                    <span>Interrupt</span>
                  </button>
                )}
              </div>
              <p className="text-zinc-100 font-medium leading-relaxed min-h-[36px]">
                {modelTranscript || <span className="text-zinc-500 italic">音声ストリーム待機中...</span>}
              </p>
            </div>
          </div>

          {/* Live Proposal Generated by Function Calling */}
          {currentProposal && (
            <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/50 space-y-3 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                  <Sparkles size={14} />
                  <span>AI提案（ApprovalCard）生成</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Tier 2 承認
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">送り先:</span>
                  <span className="text-white font-semibold">{currentProposal.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">金額:</span>
                  <span className="text-emerald-400 font-bold font-mono">{currentProposal.amountLabel}</span>
                </div>
                <div className="pt-1 text-[11px] text-zinc-300">
                  <span className="text-zinc-500">根拠: </span>
                  {currentProposal.reason}
                </div>
              </div>

              {!proposalConfirmed ? (
                <SlideToConfirm
                  label={`スライドして承認 (${currentProposal.amountLabel})`}
                  color="emerald"
                  onConfirm={handleConfirmCurrentProposal}
                />
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center space-x-2 font-bold">
                  <CheckCircle2 size={16} />
                  <span>承認完了 · Automation Engineへ引渡済</span>
                </div>
              )}
            </div>
          )}
          {/* Quick Voice / Text Command Chips (Works seamlessly even if Mic is blocked) */}
          <div className="w-full space-y-2 pt-1">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>{micPermissionDenied ? '⚡ クイック入力（マイク制限中）' : '⚡ タップして発話/送信'}</span>
              <span className="text-zinc-600">Gemini Live</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '☕ カフェ代 ¥480 を払って', text: '近くのカフェでコーヒー代 480円 を支払いたいので決済提案を作って' },
                { label: '💧 1inch Aquaで残高集約', text: '1inch Aquaを使ってウォレット内の小額残高をUSDCにまとめて' },
                { label: '💸 25 USDC 送金', text: '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01 へ 25 USDC 送金して' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendTextCommand(chip.text)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors text-left"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Direct Text Command Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTextCommand(textCommandInput);
              }}
              className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-1.5 mt-2"
            >
              <input
                type="text"
                value={textCommandInput}
                onChange={(e) => setTextCommandInput(e.target.value)}
                placeholder="音声の代わりにテキストで話しかける..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!textCommandInput.trim()}
                className="px-2.5 py-1 rounded-xl bg-white disabled:bg-zinc-800 text-black disabled:text-zinc-500 font-bold text-[11px] transition-all"
              >
                送信
              </button>
            </form>
          </div>
        </div>

        {/* Footer Voice Controls */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-around">
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              isMuted
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-zinc-900 text-zinc-200 hover:text-white border border-zinc-800'
            }`}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isMuted ? 'Unmute' : 'Mute Mic'}</span>
          </button>

          {/* Reconnect / Close Button */}
          {isConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-4 py-2.5 rounded-2xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800 transition-colors"
            >
              End Voice Call
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-5 py-2.5 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center space-x-1.5 shadow"
            >
              <Radio size={14} className="text-black" />
              <span>{isConnecting ? 'Connecting...' : 'Reconnect Live'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
