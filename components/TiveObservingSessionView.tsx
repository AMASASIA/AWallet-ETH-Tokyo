import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Activity, 
  Check, 
  Clock, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Plus,
  Mic,
  Radio
} from 'lucide-react';

export interface X402Service {
  id: string;
  name: string;
  endpoint: string;
  status: 'Authorized' | 'Discovered' | 'Blocked';
  dotColor: 'black' | 'amber' | 'rose';
  bgColor: string;
  statusColor: string;
}

export interface AuditLogEntry {
  id: string;
  status: 'Approved' | 'Pending' | 'Blocked';
  serviceName: string;
  amountUsdc: string;
  type: 'check' | 'clock' | 'cross';
  bgColor: string;
  iconColor: string;
}

const INITIAL_SERVICES: X402Service[] = [
  {
    id: 's1',
    name: 'Market data AI',
    endpoint: 'api.market.ai',
    status: 'Authorized',
    dotColor: 'black',
    bgColor: 'bg-[#dedfe4]',
    statusColor: 'text-zinc-600',
  },
  {
    id: 's2',
    name: 'Sentiment analysis',
    endpoint: 'nlp.vibe.io',
    status: 'Discovered',
    dotColor: 'amber',
    bgColor: 'bg-[#faeed6]',
    statusColor: 'text-amber-800',
  },
  {
    id: 's3',
    name: 'Image gen V3',
    endpoint: 'img.dream.net',
    status: 'Blocked',
    dotColor: 'rose',
    bgColor: 'bg-[#fbe4e7]',
    statusColor: 'text-rose-800',
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'a1',
    status: 'Approved',
    serviceName: 'Market data AI',
    amountUsdc: '0.05 USDC',
    type: 'check',
    bgColor: 'bg-[#e5edf7]',
    iconColor: 'text-blue-600',
  },
  {
    id: 'a2',
    status: 'Pending',
    serviceName: 'Sentiment analysis',
    amountUsdc: '0.01 USDC',
    type: 'clock',
    bgColor: 'bg-[#faf0d8]',
    iconColor: 'text-amber-600',
  },
  {
    id: 'a3',
    status: 'Blocked',
    serviceName: 'Image gen V3',
    amountUsdc: '0.25 USDC',
    type: 'cross',
    bgColor: 'bg-[#fae4e9]',
    iconColor: 'text-rose-600',
  },
];

interface TiveObservingSessionViewProps {
  userName?: string;
  agentDid?: string;
  agentSoul?: string;
  soulBalance?: string;
  plurality?: string;
  stampsCount?: number;
  dailyLimitUsdc?: number;
  spentTodayUsdc?: number;
  onApprovePending?: (serviceName: string, amount: string) => void;
  onOpenLiveVoice?: () => void;
  className?: string;
}

export const TiveObservingSessionView: React.FC<TiveObservingSessionViewProps> = ({
  userName = 'takumi',
  agentDid = 'did:awallet:agent:amy_01',
  agentSoul = 'amy.soul',
  soulBalance = '1,250 SOUL',
  plurality = 'Π(Q) 4.25',
  stampsCount = 8,
  dailyLimitUsdc = 500,
  spentTodayUsdc = 42.50,
  onApprovePending,
  onOpenLiveVoice,
  className = '',
}) => {
  const [services, setServices] = useState<X402Service[]>(INITIAL_SERVICES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [currentSpent, setCurrentSpent] = useState<number>(spentTodayUsdc);
  const [notification, setNotification] = useState<string | null>(null);

  const spentRatio = Math.min(100, (currentSpent / dailyLimitUsdc) * 100);

  // Authorize or toggle a discovered x402 service
  const handleToggleService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        if (s.status === 'Discovered') {
          return {
            ...s,
            status: 'Authorized',
            dotColor: 'black',
            bgColor: 'bg-[#dedfe4]',
            statusColor: 'text-zinc-600',
          };
        } else if (s.status === 'Authorized') {
          return {
            ...s,
            status: 'Blocked',
            dotColor: 'rose',
            bgColor: 'bg-[#fbe4e7]',
            statusColor: 'text-rose-800',
          };
        } else {
          return {
            ...s,
            status: 'Discovered',
            dotColor: 'amber',
            bgColor: 'bg-[#faeed6]',
            statusColor: 'text-amber-800',
          };
        }
      })
    );
  };

  // Approve a pending audit log entry
  const handleApproveEntry = (entryId: string) => {
    const entry = auditLogs.find((e) => e.id === entryId);
    if (!entry) return;

    const amountNum = parseFloat(entry.amountUsdc.replace(/[^0-9.]/g, '')) || 0.01;
    setCurrentSpent((prev) => parseFloat((prev + amountNum).toFixed(2)));

    setAuditLogs((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              status: 'Approved',
              type: 'check',
              bgColor: 'bg-[#e5edf7]',
              iconColor: 'text-blue-600',
            }
          : e
      )
    );

    setNotification(`Policy Engine Tier 2: Approved micro-payment of ${entry.amountUsdc} to ${entry.serviceName}`);
    setTimeout(() => setNotification(null), 4000);

    if (onApprovePending) {
      onApprovePending(entry.serviceName, entry.amountUsdc);
    }
  };

  return (
    <div className={`space-y-4 font-sans text-zinc-950 ${className}`}>
      {/* Top Header Bar (Matching IMG_0398.jpeg) */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-1.5 text-[17px] font-bold tracking-tight text-zinc-950">
          <span>Tive</span>
          <span className="text-zinc-950 text-base leading-none">◉</span>
          <span>AI</span>
        </div>
        <div className="flex items-center space-x-2">
          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Start Gemini Live Voice Session"
            >
              <Mic size={13} className="text-emerald-400 animate-pulse" />
              <span>Live Voice</span>
            </button>
          )}
          <div className="flex items-center space-x-1.5 text-xs text-zinc-500 font-mono tracking-tight">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Observing session</span>
          </div>
        </div>
      </div>

      {/* Greeting & DID (Matching IMG_0398.jpeg) */}
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">
          Hello, {userName}
        </h2>
        <div className="text-sm font-mono text-zinc-500 select-all">
          {agentDid}
        </div>
      </div>

      {/* Live Voice API Banner */}
      {onOpenLiveVoice && (
        <div 
          onClick={onOpenLiveVoice}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              <Mic size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 flex items-center space-x-1.5">
                <span>Start Gemini Live Voice Session</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold">
                  gemini-3.8-live
                </span>
              </div>
              <div className="text-[11px] text-zinc-600">
                Low-latency bi-directional voice &amp; automated ApprovalCards
              </div>
            </div>
          </div>
          <span className="text-xs text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform pr-1">
            Talk ➔
          </span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium flex items-center space-x-2 animate-fade-in shadow-xs">
          <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Card 1: AGENT IDENTITY (Matching IMG_0398.jpeg) */}
      <div className="bg-[#ededf0] rounded-[28px] p-5 shadow-xs border border-black/5 space-y-4">
        <div>
          <div className="text-[12px] font-bold text-zinc-500 tracking-wider uppercase">
            AGENT IDENTITY
          </div>
          <div className="text-[18px] font-bold text-zinc-950 mt-1">
            {agentSoul}
          </div>
        </div>

        <div className="text-3xl font-extrabold tracking-tight text-zinc-950">
          {soulBalance}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <div className="text-[12px] font-bold text-zinc-500 tracking-wider uppercase">
              PLURALITY
            </div>
            <div className="text-[17px] font-bold text-zinc-950 mt-0.5">
              {plurality}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-bold text-zinc-500 tracking-wider uppercase">
              STAMPS
            </div>
            <div className="text-[17px] font-bold text-zinc-950 mt-0.5">
              {stampsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Policy engine (Matching IMG_0398.jpeg) */}
      <div className="bg-[#eef4ff] rounded-[28px] p-5 shadow-xs border border-[#d8e5fc] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[17px] font-bold text-blue-600 tracking-tight">
            <ShieldCheck size={20} className="text-blue-600" />
            <span>Policy engine</span>
          </div>
          <div className="text-[13px] text-zinc-500 font-medium">
            Tier2 limit: 10 USDC
          </div>
        </div>

        {/* Daily Limit & Spent Today Boxes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/90 rounded-2xl p-3.5 shadow-2xs border border-blue-100/60">
            <div className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase">
              DAILY LIMIT
            </div>
            <div className="text-lg font-bold font-mono text-zinc-950 mt-1">
              {dailyLimitUsdc} USDC
            </div>
          </div>
          <div className="bg-white/90 rounded-2xl p-3.5 shadow-2xs border border-blue-100/60">
            <div className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase">
              SPENT TODAY
            </div>
            <div className="text-lg font-bold font-mono text-blue-600 mt-1">
              {currentSpent.toFixed(2)} USDC
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-blue-100/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${spentRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 3: x402 auto-discovery (Matching IMG_0399.jpeg) */}
      <div className="bg-[#ededf0] rounded-[28px] p-5 shadow-xs border border-black/5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[17px] font-bold text-zinc-950 tracking-tight">
            <Zap size={18} className="text-zinc-950 fill-zinc-950" />
            <span>x402 auto-discovery</span>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            HTTP 402 Agents
          </span>
        </div>

        {/* 3 x402 Service Pills */}
        <div className="space-y-2.5">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleToggleService(service.id)}
              className={`${service.bgColor} rounded-2xl p-3.5 flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:opacity-95 active:scale-[0.99]`}
              title="Click to toggle status (Authorized / Discovered / Blocked)"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    service.dotColor === 'black'
                      ? 'bg-zinc-950'
                      : service.dotColor === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <div>
                  <div className="text-[15px] font-semibold text-zinc-950 leading-snug">
                    {service.name}
                  </div>
                  <div className="text-xs font-mono text-zinc-500">
                    {service.endpoint}
                  </div>
                </div>
              </div>

              <div className={`text-[13px] font-medium tracking-tight ${service.statusColor}`}>
                {service.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Audit log (Matching IMG_0399.jpeg) */}
      <div className="bg-[#ededf0] rounded-[28px] p-5 shadow-xs border border-black/5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[17px] font-bold text-zinc-950 tracking-tight">
            <Activity size={18} className="text-zinc-950" />
            <span>Audit log</span>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            Verified receipts
          </span>
        </div>

        {/* Audit Log Entries */}
        <div className="space-y-2.5">
          {auditLogs.map((entry) => (
            <div
              key={entry.id}
              onClick={() => entry.status === 'Pending' && handleApproveEntry(entry.id)}
              className={`${entry.bgColor} rounded-2xl p-3.5 flex items-center justify-between shadow-2xs transition-all ${
                entry.status === 'Pending' ? 'cursor-pointer hover:ring-2 ring-amber-400' : ''
              }`}
              title={entry.status === 'Pending' ? 'Click to Approve this pending transaction' : ''}
            >
              <div className="flex items-center space-x-2.5">
                <div className={`shrink-0 ${entry.iconColor}`}>
                  {entry.type === 'check' && <Check size={16} strokeWidth={2.5} />}
                  {entry.type === 'clock' && <Clock size={16} strokeWidth={2.5} />}
                  {entry.type === 'cross' && <X size={16} strokeWidth={2.5} />}
                </div>
                <div className="text-[15px] font-semibold text-zinc-950">
                  {entry.status} — {entry.serviceName}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-xs font-mono font-bold text-zinc-800">
                  {entry.amountUsdc}
                </div>
                {entry.status === 'Pending' && (
                  <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    Tap to Approve
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
