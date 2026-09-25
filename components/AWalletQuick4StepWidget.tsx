import React, { useState } from 'react';
import { Zap, ShieldCheck, Cpu, ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Layers } from 'lucide-react';

interface AWalletQuick4StepWidgetProps {
  onOpenGuide: (tab?: 'steps4' | 'comparison' | 'rules3' | 'why') => void;
  onQuickSimulate?: () => void;
}

export const AWalletQuick4StepWidget: React.FC<AWalletQuick4StepWidgetProps> = ({
  onOpenGuide,
  onQuickSimulate,
}) => {
  const [activeStep, setActiveStep] = useState<number>(4);

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-950 to-black p-3.5 space-y-2.5 shadow-md">
      {/* Top row: Title + Guide Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-white text-black font-black text-[10px] flex items-center justify-center font-mono shadow-xs">
            A
          </div>
          <span className="text-xs font-bold text-white tracking-tight">
            AWallet 簡単4ステップ操作
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            x402稼働中
          </span>
        </div>

        <button
          onClick={() => onOpenGuide('comparison')}
          className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center space-x-0.5 transition-colors group cursor-pointer"
        >
          <span className="text-[10px] font-mono text-blue-400 group-hover:underline">比較・3原則</span>
          <ChevronRight size={13} className="text-zinc-500 group-hover:text-white" />
        </button>
      </div>

      {/* 4 Steps Horizontal Progress Bar */}
      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
        {/* Step 1 */}
        <button
          onClick={() => onOpenGuide('steps4')}
          className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-mono text-zinc-400">01</span>
            <CheckCircle2 size={10} className="text-emerald-400" />
          </div>
          <div className="text-[10px] font-bold text-zinc-200 truncate group-hover:text-white">
            Anchor ID
          </div>
          <div className="text-[8px] text-zinc-500 truncate">生体パスキー</div>
        </button>

        {/* Step 2 */}
        <button
          onClick={() => onOpenGuide('steps4')}
          className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-mono text-zinc-400">02</span>
            <CheckCircle2 size={10} className="text-blue-400" />
          </div>
          <div className="text-[10px] font-bold text-zinc-200 truncate group-hover:text-white">
            AtomicMint
          </div>
          <div className="text-[8px] text-zinc-500 truncate">SBT ＋ TBA</div>
        </button>

        {/* Step 3 */}
        <button
          onClick={() => onOpenGuide('steps4')}
          className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-mono text-zinc-400">03</span>
            <CheckCircle2 size={10} className="text-amber-400" />
          </div>
          <div className="text-[10px] font-bold text-zinc-200 truncate group-hover:text-white">
            予算・ルール
          </div>
          <div className="text-[8px] text-zinc-500 truncate">日次 $50 Cap</div>
        </button>

        {/* Step 4 */}
        <button
          onClick={() => onOpenGuide('steps4')}
          className="p-1.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/50 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-mono text-emerald-400 font-bold">04</span>
            <Zap size={10} className="text-emerald-400" />
          </div>
          <div className="text-[10px] font-bold text-emerald-300 truncate group-hover:text-white">
            x402 決済
          </div>
          <div className="text-[8px] text-emerald-400/80 truncate">ポップアップ無</div>
        </button>
      </div>

      {/* Bottom Quick Row: Fast Action & Why Pills */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-[10px]">
        <div className="flex items-center space-x-2 text-zinc-400">
          <span className="font-mono text-zinc-400">💡</span>
          <span>手動承認なしで裏側自動決済</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {onQuickSimulate && (
            <button
              onClick={onQuickSimulate}
              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] flex items-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-xs"
              title="x402決済を1タップでシミュレート"
            >
              <Zap size={11} />
              <span>x402 試す</span>
            </button>
          )}

          <button
            onClick={() => onOpenGuide('steps4')}
            className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[10px] font-semibold transition-colors cursor-pointer"
          >
            詳細ガイド ➔
          </button>
        </div>
      </div>
    </div>
  );
};
