import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ShieldCheck, TrendingUp, HelpCircle, Layers } from 'lucide-react';
import { Token } from '../types';

interface FusionPriceImpactChartProps {
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  spentUsd: number;
  auctionDurationSec?: number;
}

interface ImpactDataPoint {
  multiplierLabel: string;
  multiplier: number;
  amount: number;
  fusionImpact: number;
  ammImpact: number;
  efficiency: number;
  isCurrent?: boolean;
}

interface AuctionDecayPoint {
  seconds: number;
  timeLabel: string;
  rateBump: number; // percentage bump at start
  efficiency: number;
}

export const FusionPriceImpactChart: React.FC<FusionPriceImpactChartProps> = ({
  fromToken,
  toToken,
  fromAmount,
  spentUsd,
  auctionDurationSec = 120,
}) => {
  const [viewMode, setViewMode] = useState<'impact' | 'auction'>('impact');
  const [showExplanation, setShowExplanation] = useState(false);

  // Calculate current baseline metrics
  const validAmount = fromAmount > 0 ? fromAmount : 0.1;
  const validSpentUsd = spentUsd > 0 ? spentUsd : 300;

  // Generate realistic Price Impact comparison curve based on pool liquidity depth
  const impactData: ImpactDataPoint[] = useMemo(() => {
    // Multipliers around current swap size
    const multipliers = [0.25, 0.5, 1.0, 2.0, 3.5, 5.0];

    return multipliers.map((mult) => {
      const scaledUsd = validSpentUsd * mult;

      // AMM depth model: sqrt/linear liquidity impact
      // Under $100 -> ~0.05%, $1,000 -> ~0.25%, $10,000 -> ~1.4%, $50,000 -> ~4.5%
      const ammImpact = Math.min(
        6.5,
        Number((0.03 + Math.pow(scaledUsd / 2500, 0.85) * 0.38).toFixed(3))
      );

      // 1inch Fusion model: Resolver Dutch Auction aggregates multiple off-chain and on-chain liquidity
      // significantly mitigating price impact (typically 65% - 85% lower impact than pure AMM)
      const fusionImpact = Number((ammImpact * 0.22 + 0.005).toFixed(3));
      const efficiency = Number((100 - fusionImpact).toFixed(2));

      return {
        multiplierLabel: mult === 1.0 ? '1.0x (Current)' : `${mult}x`,
        multiplier: mult,
        amount: Number((validAmount * mult).toFixed(4)),
        fusionImpact,
        ammImpact,
        efficiency,
        isCurrent: mult === 1.0,
      };
    });
  }, [validAmount, validSpentUsd]);

  // Generate Dutch Auction rate decay data
  const auctionDecayData: AuctionDecayPoint[] = useMemo(() => {
    const steps = 6;
    const stepDuration = Math.floor(auctionDurationSec / (steps - 1));
    const result: AuctionDecayPoint[] = [];

    for (let i = 0; i < steps; i++) {
      const sec = i * stepDuration;
      // Dutch Auction starts with initialRateBump (e.g. +0.4% surplus for user)
      // and smoothly descends towards baseline rate (0%) where resolvers fill
      const decayRatio = 1 - i / (steps - 1);
      const rateBump = Number((decayRatio * 0.45).toFixed(2));
      const efficiency = Number((99.6 + rateBump).toFixed(2));

      result.push({
        seconds: sec,
        timeLabel: `${sec}s`,
        rateBump,
        efficiency,
      });
    }

    return result;
  }, [auctionDurationSec]);

  // Current order specific metrics
  const currentImpactPoint = impactData.find((p) => p.isCurrent) || impactData[2];
  const estimatedSavingsUsd = Math.max(
    0.05,
    ((currentImpactPoint.ammImpact - currentImpactPoint.fusionImpact) / 100) * validSpentUsd
  );

  return (
    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
      {/* Header with Title and Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <TrendingUp size={13} className="text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">Execution Efficiency</span>
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Toggle explanation"
          >
            <HelpCircle size={12} />
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setViewMode('impact')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'impact'
                ? 'bg-zinc-800 text-white font-medium shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Price Impact
          </button>
          <button
            type="button"
            onClick={() => setViewMode('auction')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'auction'
                ? 'bg-zinc-800 text-white font-medium shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Dutch Auction
          </button>
        </div>
      </div>

      {/* Explanation Banner (Collapsible) */}
      {showExplanation && (
        <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed space-y-1">
          <p>
            <strong className="text-zinc-200">1inch Fusion Resolver Auction:</strong> Instead of executing
            directly against a single AMM pool with high slippage, professional Resolvers compete to fill your
            order off-chain with MEV protection and zero gas fees.
          </p>
          <p className="text-[10px] text-zinc-500">
            Green line displays 1inch Fusion route. Dashed line represents standard AMM price impact.
          </p>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-zinc-900/50 border border-zinc-850">
        <div>
          <span className="text-[10px] text-zinc-500 block">Fusion Impact</span>
          <span className="text-xs font-mono font-semibold text-emerald-400">
            {currentImpactPoint.fusionImpact.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block">AMM Impact</span>
          <span className="text-xs font-mono font-medium text-zinc-400 line-through decoration-zinc-600">
            {currentImpactPoint.ammImpact.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block">Est. Efficiency</span>
          <span className="text-xs font-mono font-semibold text-zinc-200">
            {currentImpactPoint.efficiency.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Chart Visualization Container */}
      <div className="h-36 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'impact' ? (
            <AreaChart
              data={impactData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fusionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="ammGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#71717a" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="multiplierLabel"
                tick={{ fontSize: 9, fill: '#71717a', fontFamily: 'monospace' }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#71717a', fontFamily: 'monospace' }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
                unit="%"
                domain={[0, 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ImpactDataPoint;
                    return (
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl text-[11px] font-mono space-y-1">
                        <div className="text-zinc-400 font-sans font-medium text-[10px]">
                          Trade Size: {data.amount} {fromToken.symbol} ({data.multiplierLabel})
                        </div>
                        <div className="flex items-center justify-between gap-3 text-emerald-400">
                          <span>Fusion Impact:</span>
                          <span className="font-semibold">{data.fusionImpact.toFixed(3)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-zinc-400">
                          <span>Std AMM Impact:</span>
                          <span>{data.ammImpact.toFixed(3)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-zinc-300 border-t border-zinc-800/80 pt-1 mt-1">
                          <span>Efficiency:</span>
                          <span className="font-bold">{data.efficiency}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x="1.0x (Current)"
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="ammImpact"
                stroke="#71717a"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#ammGradient)"
                name="Std AMM Impact"
              />
              <Area
                type="monotone"
                dataKey="fusionImpact"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#fusionGradient)"
                name="1inch Fusion Impact"
              />
            </AreaChart>
          ) : (
            <AreaChart
              data={auctionDecayData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="auctionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 9, fill: '#71717a', fontFamily: 'monospace' }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#71717a', fontFamily: 'monospace' }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
                unit="%"
                domain={[99.4, 100.2]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as AuctionDecayPoint;
                    return (
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl text-[11px] font-mono space-y-1">
                        <div className="text-zinc-400 font-sans font-medium text-[10px]">
                          Auction Elapsed: {data.timeLabel}
                        </div>
                        <div className="flex items-center justify-between gap-3 text-blue-400">
                          <span>Rate Bonus:</span>
                          <span className="font-semibold">+{data.rateBump.toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-zinc-200 border-t border-zinc-800/80 pt-1 mt-1">
                          <span>Execution Efficiency:</span>
                          <span className="font-bold">{data.efficiency}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#auctionGradient)"
                name="Dutch Auction Efficiency"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-900">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-0.5 bg-emerald-400 rounded-full inline-block" />
            <span className="text-zinc-400">1inch Fusion</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-0.5 bg-zinc-550 border-t border-dashed border-zinc-400 inline-block" />
            <span className="text-zinc-500">Std AMM</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-emerald-400 font-medium">
            +${estimatedSavingsUsd.toFixed(2)} saved
          </span>
          <span className="text-zinc-600 ml-1">vs AMM</span>
        </div>
      </div>
    </div>
  );
};
