import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bluetooth, 
  Wifi,
  FileText, 
  Check, 
  RotateCcw, 
  Plus, 
  Copy, 
  CheckCircle2, 
  SlidersHorizontal,
  RefreshCw,
  ShieldCheck,
  X,
  MessageSquare,
  Mic,
  LogIn,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { InvisibleAction } from '../types';
import { BiometricAuthModal } from '../components/BiometricAuthModal';
import { DotMatrixNumber } from '../components/DotMatrixNumber';
import { TiveGeminiChatModal } from '../components/TiveGeminiChatModal';
import { TiveLiveVoiceModal } from '../components/TiveLiveVoiceModal';
import { auth, signInWithGoogle, signOutUser, persistAction } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface InvisibleFinanceViewProps {
  actions: InvisibleAction[];
  bleConnected: boolean;
  blePairing: boolean;
  onConnectBle: () => void;
  onDisconnectBle: () => void;
  onApproveAction: (id: string, viaTap: boolean, authResult?: import('../services/webauthnService').WebAuthnAssertionResult) => Promise<void>;
  onCancelAction?: (id: string) => void;
  onResetActions: () => void;
  onSimulateNewProposal: () => void;
  onAddCustomAction?: (action: InvisibleAction) => void;
  onBack: () => void;
  onOpenA2AEconomy?: () => void;
  userAddress?: string;
  userDid?: string;
}

export const InvisibleFinanceView: React.FC<InvisibleFinanceViewProps> = ({
  actions,
  bleConnected,
  blePairing,
  onConnectBle,
  onDisconnectBle,
  onApproveAction,
  onCancelAction,
  onResetActions,
  onSimulateNewProposal,
  onAddCustomAction,
  onBack,
  userAddress,
  userDid,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [biometricModalAction, setBiometricModalAction] = useState<InvisibleAction | null>(null);
  
  // AI & Auth Modals
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    return () => unsub();
  }, []);

  // Filter actions
  const filteredActions = actions.filter((action) => {
    if (filter === 'pending') return action.status === 'awaiting';
    return true;
  });

  const pendingCount = actions.filter((a) => a.status === 'awaiting').length;
  const activeAction = actions.find((a) => a.status === 'awaiting') || actions[0] || null;
  const selectedAction = actions.find((a) => a.id === selectedActionId) || null;

  const handleApprove = async (id: string, viaTap: boolean, authResult?: import('../services/webauthnService').WebAuthnAssertionResult) => {
    setProcessingId(id);
    try {
      await onApproveAction(id, viaTap, authResult);
      if (selectedActionId === id) setSelectedActionId(null);
    } finally {
      setProcessingId(null);
    }
  };

  const copyJson = (action: InvisibleAction) => {
    const data = {
      destination: action.destination || action.target || 'Direct',
      amount: action.amount,
      reason: action.reasonEn || action.reason,
      whyApprovalNeeded: action.whyApprovalNeededEn || action.whyApprovalNeeded,
    };
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    setCopiedId(action.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="invisible-finance-view space-y-4 pb-24 animate-fade-in select-none max-w-md mx-auto px-1">
      {/* 1. Header Bar: Back, Title, Auth, Live Voice, Chat, Specs */}
      <div className="flex items-center justify-between h-12">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-base font-semibold text-white tracking-tight">
          Item Details
        </h1>

        <div className="flex items-center space-x-1.5">
          {/* Live Voice Button (Cyan glow) */}
          <button
            onClick={() => setIsLiveVoiceOpen(true)}
            type="button"
            className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-500/50 hover:border-cyan-400 flex items-center justify-center text-cyan-300 hover:text-white transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)] active:scale-95 cursor-pointer"
            title="Live Voice (gemini-3.8-live)"
          >
            <Mic size={16} className="text-cyan-400 animate-pulse" />
          </button>

          {/* Gemini Chat & Maps Grounding Button (Pink/Magenta glow) */}
          <button
            onClick={() => setIsChatModalOpen(true)}
            type="button"
            className="w-10 h-10 rounded-full bg-pink-950/40 border border-pink-500/50 hover:border-pink-400 flex items-center justify-center text-pink-300 hover:text-white transition-all shadow-[0_0_12px_rgba(244,114,182,0.3)] active:scale-95 cursor-pointer"
            title="Tive ◉AI Chat & Maps Grounding"
          >
            <Sparkles size={16} className="text-pink-400" />
          </button>

          {/* Google Auth with Firebase */}
          <button
            onClick={async () => {
              if (firebaseUser) {
                await signOutUser();
              } else {
                await signInWithGoogle();
              }
            }}
            type="button"
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer ${
              firebaseUser
                ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title={firebaseUser ? `Signed in as ${firebaseUser.displayName || firebaseUser.email} (Click to sign out)` : 'Sign in with Google'}
          >
            {firebaseUser?.photoURL ? (
              <img src={firebaseUser.photoURL} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
            ) : firebaseUser ? (
              <UserIcon size={16} className="text-emerald-400" />
            ) : (
              <LogIn size={16} />
            )}
          </button>

          {/* Specs / Options */}
          <button
            onClick={() => setShowSpecModal(true)}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Info & Specs"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* 2. Top Capsule Row (Directly from IMG_0191: Fuchsia Card + Doc Pill + Vertical BLE Pill) */}
      <div className="flex items-center space-x-2.5">
        {/* Left: Fuchsia / Magenta Card */}
        <div 
          onClick={() => activeAction && setSelectedActionId(activeAction.id)}
          className="flex-1 h-20 rounded-[24px] bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 p-3.5 text-white shadow-[0_8px_20px_rgba(217,70,239,0.3)] relative overflow-hidden flex flex-col justify-between cursor-pointer hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white truncate max-w-[140px]">
              {activeAction ? (activeAction.descEn || activeAction.desc) : 'Coffee & Tipping'}
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/25 text-white/90">
              {activeAction ? `Tier ${activeAction.tier}` : 'Tier 2'}
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div className="w-8 h-1 bg-white/40 rounded-full mb-1" />
            <div className="text-right">
              <span className="text-[9px] text-white/80 uppercase font-mono tracking-wider block -mb-0.5">Total cost</span>
              <DotMatrixNumber 
                value={activeAction?.amount || '$16.25'} 
                size="sm" 
                dotColor="#ffffff" 
              />
            </div>
          </div>
        </div>

        {/* Middle: Document Pill */}
        <button
          onClick={() => setShowSpecModal(true)}
          className="w-12 h-20 rounded-full bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
          title="View Specs"
        >
          <FileText size={18} className="text-zinc-300" />
        </button>

        {/* Right: Vertical WiFi / BLE Hardware Pill (Glows radiant cyan when connected) */}
        <button
          onClick={bleConnected ? onDisconnectBle : onConnectBle}
          disabled={blePairing}
          type="button"
          title={bleConnected ? 'WiFi/BLE Connected (Click to disconnect)' : 'Click to connect WiFi/BLE Hardware'}
          className={`w-12 h-20 rounded-full transition-all duration-300 flex flex-col items-center justify-between py-2 px-1 cursor-pointer select-none shrink-0 active:scale-95 ${
            bleConnected
              ? 'bg-cyan-400 text-black border border-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.9)]'
              : blePairing
              ? 'bg-amber-400 text-black border border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.6)] animate-pulse'
              : 'bg-cyan-950/30 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/40'
          }`}
        >
          <div className="relative flex flex-col items-center justify-center space-y-0.5 pt-0.5">
            {bleConnected && (
              <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-cyan-400 opacity-60 duration-1000" />
            )}
            <Wifi size={13} className={bleConnected ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <Bluetooth size={14} className={bleConnected ? 'stroke-[2.5]' : 'stroke-[2]'} />
          </div>

          <div className="flex flex-col items-center">
            <span 
              className={`w-2 h-2 rounded-full mb-0.5 ${
                bleConnected 
                  ? 'bg-cyan-950 animate-pulse' 
                  : blePairing 
                  ? 'bg-amber-950 animate-ping' 
                  : 'bg-cyan-400'
              }`} 
            />
            <span className="text-[7.5px] font-mono font-extrabold uppercase tracking-tighter">
              {bleConnected ? 'ON' : blePairing ? '...' : 'WIFI/BLE'}
            </span>
          </div>
        </button>
      </div>

      {/* 3. Simple Controls: Filter Tabs + Add + Reset */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            All ({actions.length})
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center space-x-1 ${
              filter === 'pending'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-pink-500 text-white font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onSimulateNewProposal}
            className="px-2.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center space-x-1 cursor-pointer"
            title="Add simulated payment"
          >
            <Plus size={12} />
            <span>Add</span>
          </button>

          <button
            onClick={onResetActions}
            className="p-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            title="Reset"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* 4. Full-Width Stacked Cards (Directly matching IMG_0191 aesthetic) */}
      <div className="space-y-3.5 pt-1">
        {filteredActions.map((action, idx) => {
          const isAwaiting = action.status === 'awaiting';
          const isDone = action.status === 'approved_app' || action.status === 'approved_tap' || action.status === 'auto_approved';

          // Color themes inspired by IMG_0191 (Olive/Slate frosted, Peach/Coral, Fuchsia, Teal)
          const colorTheme = idx % 3 === 0
            ? {
                cardBg: 'bg-gradient-to-br from-zinc-800/80 via-zinc-900/90 to-zinc-950 border-zinc-700/60',
                glow: 'shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
              }
            : idx % 3 === 1
            ? {
                cardBg: 'bg-gradient-to-br from-orange-950/30 via-zinc-900/90 to-zinc-950 border-orange-800/40',
                glow: 'shadow-[0_8px_24px_rgba(249,115,22,0.15)]',
              }
            : {
                cardBg: 'bg-gradient-to-br from-teal-950/30 via-zinc-900/90 to-zinc-950 border-teal-800/40',
                glow: 'shadow-[0_8px_24px_rgba(13,148,136,0.15)]',
              };

          return (
            <div
              key={action.id}
              className={`rounded-[28px] border p-4 text-white ${colorTheme.cardBg} ${colorTheme.glow} transition-all duration-200 space-y-3`}
            >
              {/* Card Top: Title & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    {action.descEn || action.desc}
                  </h3>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    {action.destination ? action.destination.slice(0, 20) : 'Direct'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                    Tier {action.tier}
                  </span>
                </div>
              </div>

              {/* Card Middle: Part No & Total Cost (Matching IMG_0191) */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Part No
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    {action.id.toUpperCase().replace('ACT-', 'BP30')}
                  </span>
                </div>

                <div className="w-12 h-0.5 bg-zinc-800 rounded-full" />

                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Total cost
                  </span>
                  <div className="mt-0.5">
                    <DotMatrixNumber 
                      value={action.amount} 
                      size="md" 
                      dotColor="#ffffff" 
                    />
                  </div>
                </div>
              </div>

              {/* Card Bottom: Big Clear Action Button */}
              <div className="pt-1">
                {isAwaiting ? (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={processingId === action.id}
                      onClick={() => {
                        if (action.tier === 2) {
                          handleApprove(action.id, bleConnected);
                        } else if (action.tier === 3 || action.tier === 5) {
                          setBiometricModalAction(action);
                        } else {
                          handleApprove(action.id, false);
                        }
                      }}
                      className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
                        action.tier === 2 && bleConnected
                          ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_22px_rgba(34,211,238,0.75)]'
                          : 'bg-white hover:bg-zinc-200 text-black'
                      }`}
                    >
                      {processingId === action.id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : action.tier === 2 && bleConnected ? (
                        <>
                          <div className="flex items-center space-x-1">
                            <Wifi size={13} className="stroke-[2.5]" />
                            <Bluetooth size={13} className="stroke-[2.5]" />
                          </div>
                          <span>Tap WiFi/BLE Key to Pay</span>
                        </>
                      ) : action.tier === 3 || action.tier === 5 ? (
                        <>
                          <ShieldCheck size={14} />
                          <span>Biometric Passkey Sign</span>
                        </>
                      ) : (
                        <span>Approve Payment</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedActionId(action.id)}
                      className="px-3.5 py-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700/60 cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-center space-x-1.5 font-semibold">
                    <Check size={14} className="text-emerald-400 stroke-[3]" />
                    <span>Paid &amp; Settled</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Minimal Details Sheet Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md rounded-t-[30px] sm:rounded-[30px] bg-zinc-950 border border-zinc-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="text-xs font-mono font-bold text-zinc-400">
                Tier {selectedAction.tier} · {selectedAction.category || 'Payment'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyJson(selectedAction)}
                  className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                  title="Copy JSON"
                >
                  {copiedId === selectedAction.id ? (
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>

                <button
                  onClick={() => setSelectedActionId(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                {selectedAction.descEn || selectedAction.desc}
              </h2>
              <div className="py-2">
                <DotMatrixNumber 
                  value={selectedAction.amount} 
                  size="lg" 
                  dotColor="#ffffff" 
                />
                {selectedAction.amountLabel && (
                  <span className="text-xs font-mono text-zinc-400 block mt-1">
                    {selectedAction.amountLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <div className="text-zinc-500 font-mono text-[10px]">Destination</div>
              <div className="text-zinc-200 font-mono font-semibold break-all mt-0.5">
                {selectedAction.destination || selectedAction.target || 'Direct Vault'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
              {selectedAction.reasonEn || selectedAction.reason}
            </div>

            {selectedAction.status === 'awaiting' ? (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    if (selectedAction.tier === 2) {
                      handleApprove(selectedAction.id, bleConnected);
                    } else if (selectedAction.tier === 3 || selectedAction.tier === 5) {
                      setBiometricModalAction(selectedAction);
                    } else {
                      handleApprove(selectedAction.id, false);
                    }
                  }}
                  disabled={processingId === selectedAction.id}
                  className={`w-full py-3.5 active:scale-[0.99] font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer ${
                    selectedAction.tier === 2 && bleConnected
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_22px_rgba(34,211,238,0.75)]'
                      : 'bg-white hover:bg-zinc-200 text-black'
                  }`}
                >
                  {processingId === selectedAction.id ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : selectedAction.tier === 2 && bleConnected ? (
                    <>
                      <div className="flex items-center space-x-1">
                        <Wifi size={13} className="stroke-[2.5]" />
                        <Bluetooth size={13} className="stroke-[2.5]" />
                      </div>
                      <span>Approve with WiFi/BLE Key</span>
                    </>
                  ) : selectedAction.tier === 3 || selectedAction.tier === 5 ? (
                    <>
                      <ShieldCheck size={14} />
                      <span>Biometric Passkey Sign</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Approve</span>
                  )}
                </button>

                {onCancelAction && (
                  <button
                    onClick={() => {
                      onCancelAction(selectedAction.id);
                      setSelectedActionId(null);
                    }}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-2xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-center space-x-2">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span>Proposal Settled</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Biometric Passkey WebAuthn Modal */}
      {biometricModalAction && (
        <BiometricAuthModal
          isOpen={true}
          action={biometricModalAction}
          onClose={() => setBiometricModalAction(null)}
          onSuccess={(action, authResult) => {
            const targetId = action.id;
            setBiometricModalAction(null);
            handleApprove(targetId, false, authResult);
            setSelectedActionId(null);
          }}
          userAddress={userAddress}
          userDid={userDid}
        />
      )}

      {/* Info / Specs Modal */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full rounded-[28px] bg-zinc-950 border border-zinc-800 p-5 space-y-3 text-xs text-zinc-300">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="font-bold text-white text-sm">Tive ◉AI Policy Engine</span>
              <button
                onClick={() => setShowSpecModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-zinc-400 leading-relaxed">
              Autonomous orchestration layer. Generates executable proposals without holding private keys. Execution is governed by Policy Engine.
            </p>

            <button
              onClick={() => setShowSpecModal(false)}
              className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Multi-turn Gemini Chatbot with Google Maps Grounding & Firebase Firestore */}
      <TiveGeminiChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onAddAction={(newAct) => {
          if (onAddCustomAction) {
            onAddCustomAction(newAct);
          }
          if (firebaseUser) {
            persistAction(firebaseUser.uid, newAct).catch(console.warn);
          }
        }}
        userAddress={userAddress}
      />

      {/* Real-time Voice Live API (gemini-3.8-live) */}
      <TiveLiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        userAddress={userAddress}
        onConfirmProposal={(proposal) => {
          const newAct: InvisibleAction = {
            id: `act-live-${Date.now()}`,
            tier: 2,
            desc: proposal.destination,
            descEn: proposal.destination,
            amount: proposal.amountLabel.split(' ')[0] || '¥500',
            amountLabel: proposal.amountLabel,
            destination: proposal.destination,
            reason: proposal.reason,
            reasonEn: proposal.reason,
            whyApprovalNeeded: proposal.whyApprovalNeeded,
            whyApprovalNeededEn: proposal.whyApprovalNeeded,
            initiatedBy: 'Tive ◉AI Live Voice (gemini-3.8-live)',
            status: 'awaiting',
            timestamp: 'Just now',
            category: 'Payment'
          };
          if (onAddCustomAction) {
            onAddCustomAction(newAct);
          }
          if (firebaseUser) {
            persistAction(firebaseUser.uid, newAct).catch(console.warn);
          }
        }}
      />
    </div>
  );
};
