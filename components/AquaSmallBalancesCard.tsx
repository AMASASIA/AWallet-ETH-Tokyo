import React from 'react';
import { ArrowRight, Layers, Hexagon } from 'lucide-react';

export interface SmallBalanceCoin {
  symbol: string;
  name: string;
  change24h: number;
  balance: number;
  rateUsd: number;
  valueUsd: number;
  iconType: 'btc' | 'sol' | 'dash' | 'eth' | 'generic';
  sparkline: { x: number; y: number }[];
  endpointDotIndex?: number;
}

export const INITIAL_AQUA_COINS: SmallBalanceCoin[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    change24h: 5.76,
    balance: 0.00065,
    rateUsd: 64728,
    valueUsd: 42.07,
    iconType: 'btc',
    sparkline: [
      { x: 0, y: 18 },
      { x: 20, y: 13 },
      { x: 40, y: 14 },
      { x: 60, y: 19 },
      { x: 80, y: 15 },
      { x: 100, y: 10 }
    ],
    endpointDotIndex: 5,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    change24h: -12.00,
    balance: 0.00065,
    rateUsd: 64728,
    valueUsd: 42.07,
    iconType: 'sol',
    sparkline: [
      { x: 0, y: 10 },
      { x: 25, y: 11 },
      { x: 50, y: 13 },
      { x: 75, y: 22 },
      { x: 100, y: 12 }
    ],
    endpointDotIndex: 3, // dot at dip
  },
  {
    symbol: 'DASH',
    name: 'Dash',
    change24h: 3.28,
    balance: 0.00065,
    rateUsd: 64728,
    valueUsd: 42.07,
    iconType: 'dash',
    sparkline: [
      { x: 0, y: 17 },
      { x: 30, y: 12 },
      { x: 60, y: 20 },
      { x: 80, y: 18 },
      { x: 100, y: 16 }
    ],
    endpointDotIndex: 1,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    change24h: -9.36,
    balance: 0.00065,
    rateUsd: 64728,
    valueUsd: 42.07,
    iconType: 'eth',
    sparkline: [
      { x: 0, y: 18 },
      { x: 25, y: 17 },
      { x: 50, y: 15 },
      { x: 70, y: 9 },
      { x: 100, y: 16 }
    ],
    endpointDotIndex: 3,
  },
];

interface AquaSmallBalancesCardProps {
  coinsCount?: number;
  coins?: SmallBalanceCoin[];
  onCheckBalance: () => void;
  className?: string;
}

export const AquaSmallBalancesCard: React.FC<AquaSmallBalancesCardProps> = ({
  coinsCount = 18,
  coins = INITIAL_AQUA_COINS,
  onCheckBalance,
  className = '',
}) => {
  const formatSparklinePath = (points: { x: number; y: number }[]) => {
    return points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  };

  const renderCoinIcon = (type: SmallBalanceCoin['iconType']) => {
    switch (type) {
      case 'btc':
        return (
          <div className="w-6 h-6 flex items-center justify-center font-bold text-base text-zinc-900 leading-none">
            ₿
          </div>
        );
      case 'sol':
        return (
          <div className="w-6 h-6 flex items-center justify-center text-zinc-900">
            <Layers size={18} strokeWidth={2.2} />
          </div>
        );
      case 'dash':
        return (
          <div className="w-6 h-6 flex items-center justify-center font-bold text-base text-zinc-900 leading-none">
            $
          </div>
        );
      case 'eth':
        return (
          <div className="w-6 h-6 flex items-center justify-center text-zinc-900">
            <Hexagon size={18} strokeWidth={2.2} />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center font-bold text-xs text-zinc-900">
            ◉
          </div>
        );
    }
  };

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Top Banner Card (Matching User Reference Image 1) */}
      <div className="bg-[#ededf0] rounded-[28px] p-5 shadow-xs border border-black/5 text-zinc-900">
        <div className="flex items-start justify-between">
          <h3 className="text-[17px] font-semibold tracking-tight text-zinc-900 max-w-[200px] leading-snug">
            Small balances found in your wallet
          </h3>
          <div className="text-right">
            <div className="text-3xl font-extrabold tracking-tight text-zinc-950 leading-none">
              {coinsCount}
            </div>
            <div className="text-[13px] text-zinc-500 font-normal mt-0.5">
              coins
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onCheckBalance}
          className="mt-6 w-full flex items-center space-x-3 bg-[#e3e3e7] hover:bg-[#dadadf] text-zinc-900 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.99] group shadow-2xs"
        >
          <div className="w-7 h-7 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
            <ArrowRight size={15} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">
            Check balance
          </span>
        </button>
      </div>

      {/* 2x2 Grid matching Image 1 */}
      <div className="grid grid-cols-2 gap-3">
        {coins.slice(0, 4).map((coin) => {
          const isPositive = coin.change24h >= 0;
          const sparklinePath = formatSparklinePath(coin.sparkline);
          const dotPoint = coin.endpointDotIndex !== undefined && coin.sparkline[coin.endpointDotIndex]
            ? coin.sparkline[coin.endpointDotIndex]
            : coin.sparkline[coin.sparkline.length - 1];

          return (
            <div
              key={coin.symbol}
              onClick={onCheckBalance}
              className="bg-[#ededf0] hover:bg-[#e7e7eb] rounded-[24px] p-4 shadow-xs border border-black/5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-sm active:scale-[0.98]"
            >
              {/* Header: Symbol & 24h Change */}
              <div className="flex items-baseline justify-between">
                <span className="text-[17px] font-bold text-zinc-950 tracking-tight">
                  {coin.symbol}
                </span>
                <span
                  className={`text-[13px] font-medium tracking-tight ${
                    isPositive ? 'text-zinc-600' : 'text-zinc-600'
                  }`}
                >
                  {isPositive ? `+${coin.change24h.toFixed(2)}%` : `${coin.change24h.toFixed(2)}%`}
                </span>
              </div>

              {/* Name */}
              <div className="text-[13px] text-zinc-500 font-normal -mt-0.5">
                {coin.name}
              </div>

              {/* Sparkline Graph */}
              <div className="my-3 py-1 flex items-center justify-center">
                <svg
                  viewBox="0 0 100 28"
                  className="w-full h-7 overflow-visible stroke-zinc-700"
                  fill="none"
                >
                  <path
                    d={sparklinePath}
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {dotPoint && (
                    <circle
                      cx={dotPoint.x}
                      cy={dotPoint.y}
                      r="3.2"
                      className="fill-zinc-950 stroke-none"
                    />
                  )}
                </svg>
              </div>

              {/* Bottom Row: Icon on left, Balance & Fiat on right */}
              <div className="flex items-end justify-between pt-1">
                <div className="text-zinc-800">
                  {renderCoinIcon(coin.iconType)}
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-semibold text-zinc-950 leading-tight">
                    {coin.balance}
                  </div>
                  <div className="text-[12px] text-zinc-500 font-normal leading-tight mt-0.5">
                    ${coin.rateUsd.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
