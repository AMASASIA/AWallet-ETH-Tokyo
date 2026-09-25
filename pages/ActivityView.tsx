import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Shield, CheckCircle2 } from 'lucide-react';
import { Activity } from '../types';

interface ActivityViewProps {
  activities: Activity[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ activities }) => {
  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-white tracking-tight">Activity</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Transactions and contract interactions on Base</p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-sm">No activity recorded</p>
          <p className="text-xs mt-1">Transfers and governance signatures will show here</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-900/60 pt-2">
          {activities.map((act) => {
            const isTransfer = act.type === 'Transfer';
            const isMint = act.type === 'Mint';
            const isApproval = act.type === 'Approval';

            return (
              <div key={act.id} className="flex items-center justify-between py-4 px-1">
                <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-300 flex-shrink-0">
                    {isTransfer ? (
                      <ArrowUpRight size={18} />
                    ) : isMint ? (
                      <ArrowDownLeft size={18} />
                    ) : isApproval ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Shield size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{act.detail}</p>
                    <p className="text-[11px] text-zinc-600 font-mono mt-0.5">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.type}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] font-mono text-zinc-500">Base</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
