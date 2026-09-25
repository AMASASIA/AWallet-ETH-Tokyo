import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  MapPin, 
  ExternalLink, 
  Mic, 
  Radio, 
  RefreshCw, 
  Zap, 
  Check, 
  Layers, 
  LogIn, 
  LogOut,
  User as UserIcon,
  Compass
} from 'lucide-react';
import { auth, signInWithGoogle, signOutUser, persistChatMessage, persistAction } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { InvisibleAction } from '../types';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: string;
  actionProposal?: {
    destination: string;
    amountLabel: string;
    reason: string;
    whyApprovalNeeded: string;
  };
  extractedLinks?: { title: string; uri: string }[];
  isMapGrounded?: boolean;
}

interface TiveGeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveVoice: () => void;
  onAddAction?: (action: InvisibleAction) => void;
  userAddress?: string;
}

export const TiveGeminiChatModal: React.FC<TiveGeminiChatModalProps> = ({
  isOpen,
  onClose,
  onOpenLiveVoice,
  onAddAction,
  userAddress = '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01',
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.5-flash');
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      content: 'Hello! I am Tive ◉AI. I coordinate with Gemini to analyze your financial intents, suggest safe payment actions for the Policy Engine, and find nearby merchants using Google Maps grounding. How can I assist your wallet today?',
      model: 'gemini-3.5-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [proposalAddedMap, setProposalAddedMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Request browser location for Maps Grounding if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => {
          // Fallback to Tokyo central coordinates for crypto merchant discovery
          setUserLocation({ latitude: 35.6762, longitude: 139.6503 });
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleGoogleAuth = async () => {
    try {
      if (firebaseUser) {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      console.error('Firebase Auth error:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userText = inputPrompt.trim();
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    // Save to Firestore if authenticated
    if (firebaseUser) {
      persistChatMessage(firebaseUser.uid, {
        id: userMsgId,
        sender: 'user',
        content: userText,
        model: selectedModel,
        timestamp: new Date().toISOString()
      }).catch(console.warn);
    }

    try {
      // Build conversation payload
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.content
      }));
      historyPayload.push({ role: 'user', content: userText });

      const res = await fetch('/api/tive/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          model: selectedModel,
          userLocation,
          locale: 'en'
        })
      });

      const data = await res.json();
      const botMsgId = `assistant-${Date.now()}`;
      const botMsg: ChatMessageItem = {
        id: botMsgId,
        sender: 'assistant',
        content: data.reply || 'No response received from Tive ◉AI.',
        model: data.model || selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionProposal: data.actionProposal,
        extractedLinks: data.extractedLinks,
        isMapGrounded: Boolean(data.isMapGrounded)
      };

      setMessages((prev) => [...prev, botMsg]);

      // Save assistant message to Firestore if authenticated
      if (firebaseUser) {
        persistChatMessage(firebaseUser.uid, {
          id: botMsgId,
          sender: 'assistant',
          content: botMsg.content,
          model: botMsg.model,
          timestamp: new Date().toISOString()
        }).catch(console.warn);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessageItem = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        content: 'I encountered an error processing your request. Please check your connection or try another model.',
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProposalToActionList = (proposal: ChatMessageItem['actionProposal'], msgId: string) => {
    if (!proposal || !onAddAction) return;
    const newAction: InvisibleAction = {
      id: `act-chat-${Date.now()}`,
      tier: 2,
      desc: `Payment to ${proposal.destination.split(' ')[0]}`,
      descEn: `Payment to ${proposal.destination.split(' ')[0]}`,
      amount: proposal.amountLabel.split(' ')[0] || '¥650',
      amountLabel: proposal.amountLabel,
      destination: proposal.destination,
      reason: proposal.reason,
      reasonEn: proposal.reason,
      whyApprovalNeeded: proposal.whyApprovalNeeded,
      whyApprovalNeededEn: proposal.whyApprovalNeeded,
      initiatedBy: 'Tive ◉AI Chat',
      status: 'awaiting',
      timestamp: 'Just now',
      category: 'Payment'
    };

    onAddAction(newAction);
    setProposalAddedMap((prev) => ({ ...prev, [msgId]: true }));

    // Persist to Firestore if user logged in
    if (firebaseUser) {
      persistAction(firebaseUser.uid, newAction).catch(console.warn);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg h-[92vh] max-h-[780px] rounded-[32px] bg-[#0c0c0e] border border-zinc-800/90 shadow-2xl flex flex-col overflow-hidden text-zinc-100 font-sans">
        
        {/* 1. Header Bar: Title, Auth, Live Voice, Close */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="text-pink-400 font-extrabold text-lg leading-none">◉</span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-wide">Tive ◉AI Chat</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
                  Multi-Turn
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Live API Real-Time Voice Button */}
            <button
              onClick={() => {
                onClose();
                onOpenLiveVoice();
              }}
              type="button"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs transition-all shadow-[0_0_16px_rgba(34,211,238,0.5)] active:scale-95 cursor-pointer"
              title="Launch gemini-3.8-live Real-Time Voice"
            >
              <Mic size={13} className="animate-pulse" />
              <span>Live Voice</span>
            </button>

            {/* Google Sign-in with Firebase Auth */}
            <button
              onClick={handleGoogleAuth}
              type="button"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                firebaseUser
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
              title={firebaseUser ? `Signed in as ${firebaseUser.displayName || firebaseUser.email}` : 'Sign in with Google'}
            >
              {firebaseUser ? (
                <>
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-emerald-500">
                    {firebaseUser.photoURL ? (
                      <img src={firebaseUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={12} className="text-black m-0.5" />
                    )}
                  </div>
                  <span className="max-w-[70px] truncate text-[11px]">
                    {firebaseUser.displayName?.split(' ')[0] || 'User'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn size={13} />
                  <span className="text-[11px]">Google</span>
                </>
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2. Model Selector Pill Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/60 shrink-0 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-zinc-400 mr-1 font-mono">Model:</span>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                selectedModel === 'gemini-3.5-flash'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
              title="gemini-3.5-flash (General Tasks & Google Maps Grounding)"
            >
              <Compass size={11} className={selectedModel === 'gemini-3.5-flash' ? 'text-black' : 'text-cyan-400'} />
              <span>3.5-Flash (Maps)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
              title="gemini-3.1-flash-lite (Ultra Fast)"
            >
              <Zap size={11} className={selectedModel === 'gemini-3.1-flash-lite' ? 'text-black' : 'text-amber-400'} />
              <span>3.1-Lite (Fast)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
              title="gemini-3.1-pro-preview (Complex Reasoning)"
            >
              <Sparkles size={11} className={selectedModel === 'gemini-3.1-pro-preview' ? 'text-black' : 'text-purple-400'} />
              <span>3.1-Pro (Deep)</span>
            </button>
          </div>

          <div className="text-[10px] font-mono text-zinc-500">
            {firebaseUser ? '☁️ Cloud Synced' : 'Offline Mode'}
          </div>
        </div>

        {/* 3. Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-zinc-800 text-white rounded-br-xs'
                    : 'bg-zinc-900/90 border border-zinc-800/80 text-zinc-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-[13px]">{msg.content}</div>

                {/* Google Maps Grounding Links and Cards */}
                {msg.extractedLinks && msg.extractedLinks.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-cyan-300">
                      <MapPin size={13} />
                      <span>Google Maps Locations</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.extractedLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-cyan-800/40 hover:border-cyan-400 text-zinc-200 hover:text-white transition-all group"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            <span className="text-xs font-medium truncate">{link.title}</span>
                          </div>
                          <ExternalLink size={12} className="text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Financial Action Proposal (ApprovalCard) */}
                {msg.actionProposal && (
                  <div className="mt-3 p-3 rounded-2xl bg-zinc-950 border border-pink-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-pink-300 font-bold text-xs">
                        <Zap size={13} className="text-pink-400" />
                        <span>{msg.actionProposal.amountLabel}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300">
                        Proposal
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-[11px] text-zinc-300 font-sans">
                      <div><span className="text-zinc-500 font-mono">To:</span> {msg.actionProposal.destination}</div>
                      <div><span className="text-zinc-500 font-mono">Reason:</span> {msg.actionProposal.reason}</div>
                      <div className="text-[10px] text-amber-300/80"><span className="text-zinc-500 font-mono">Rule:</span> {msg.actionProposal.whyApprovalNeeded}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddProposalToActionList(msg.actionProposal, msg.id)}
                      disabled={proposalAddedMap[msg.id]}
                      className={`w-full mt-2 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        proposalAddedMap[msg.id]
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-white hover:bg-zinc-200 text-black shadow-md active:scale-98'
                      }`}
                    >
                      {proposalAddedMap[msg.id] ? (
                        <>
                          <Check size={14} />
                          <span>Added to Policy Queue</span>
                        </>
                      ) : (
                        <>
                          <Zap size={13} />
                          <span>Add to Wallet Action Cards</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500 mt-1 px-1">
                <span>{msg.timestamp}</span>
                {msg.model && <span>· {msg.model}</span>}
                {msg.isMapGrounded && <span className="text-cyan-400">· Maps Grounded</span>}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono p-2">
              <RefreshCw size={13} className="animate-spin text-pink-400" />
              <span>Tive ◉AI is reasoning with {selectedModel}...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 4. Suggested Quick Prompts */}
        <div className="px-4 py-1.5 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0 border-t border-zinc-900 bg-zinc-950/40">
          <button
            type="button"
            onClick={() => setInputPrompt('Find nearby cafes in Tokyo accepting payments')}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white shrink-0 cursor-pointer flex items-center space-x-1"
          >
            <MapPin size={11} className="text-cyan-400" />
            <span>Nearby cafes (Maps)</span>
          </button>
          <button
            type="button"
            onClick={() => setInputPrompt('Pay ¥650 for Blue Bottle Coffee')}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white shrink-0 cursor-pointer flex items-center space-x-1"
          >
            <Zap size={11} className="text-pink-400" />
            <span>Pay ¥650 coffee</span>
          </button>
          <button
            type="button"
            onClick={() => setInputPrompt('Where can I find crypto ATMs or Web3 stores?')}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white shrink-0 cursor-pointer flex items-center space-x-1"
          >
            <Compass size={11} className="text-emerald-400" />
            <span>Crypto ATMs</span>
          </button>
        </div>

        {/* 5. Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-zinc-800/80 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Tive ◉AI, propose payment, or search places..."
              className="w-full pl-4 pr-24 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all font-sans"
            />
            <div className="absolute right-2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLiveVoice();
                }}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-all cursor-pointer"
                title="Switch to Live Voice"
              >
                <Mic size={15} />
              </button>
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="p-2 rounded-xl bg-white hover:bg-zinc-200 text-black disabled:opacity-30 transition-all cursor-pointer font-bold"
                title="Send Message"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
