import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { INITIAL_AQUA_COINS, SmallBalanceCoin } from './AquaSmallBalancesCard';

export interface ExtendedAquaCoin extends SmallBalanceCoin {
  chain: string;
  selected: boolean;
}

const ALL_18_COINS: ExtendedAquaCoin[] = [
  ...INITIAL_AQUA_COINS.map(c => ({ ...c, chain: 'Base / L1', selected: true })),
  {
    symbol: 'OP',
    name: 'Optimism',
    change24h: 2.14,
    balance: 14.2,
    rateUsd: 1.85,
    valueUsd: 26.27,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 15 }, { x: 50, y: 12 }, { x: 100, y: 10 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'ARB',
    name: 'Arbitrum',
    change24h: -4.12,
    balance: 22.5,
    rateUsd: 0.98,
    valueUsd: 22.05,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 10 }, { x: 50, y: 16 }, { x: 100, y: 14 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    change24h: 1.05,
    balance: 45.0,
    rateUsd: 0.42,
    valueUsd: 18.90,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 14 }, { x: 50, y: 13 }, { x: 100, y: 11 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    change24h: 6.80,
    balance: 1.45,
    rateUsd: 13.50,
    valueUsd: 19.57,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 18 }, { x: 50, y: 14 }, { x: 100, y: 8 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    change24h: -1.45,
    balance: 2.8,
    rateUsd: 7.20,
    valueUsd: 20.16,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 12 }, { x: 50, y: 14 }, { x: 100, y: 15 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'AAVE',
    name: 'Aave',
    change24h: 3.90,
    balance: 0.12,
    rateUsd: 148.00,
    valueUsd: 17.76,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 16 }, { x: 50, y: 12 }, { x: 100, y: 9 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'CRV',
    name: 'Curve DAO',
    change24h: -2.30,
    balance: 48.0,
    rateUsd: 0.31,
    valueUsd: 14.88,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 11 }, { x: 50, y: 15 }, { x: 100, y: 16 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'SNX',
    name: 'Synthetix',
    change24h: 0.85,
    balance: 8.5,
    rateUsd: 1.62,
    valueUsd: 13.77,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 15 }, { x: 50, y: 14 }, { x: 100, y: 12 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'COMP',
    name: 'Compound',
    change24h: -0.95,
    balance: 0.28,
    rateUsd: 46.00,
    valueUsd: 12.88,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 12 }, { x: 50, y: 13 }, { x: 100, y: 14 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'MKR',
    name: 'Maker',
    change24h: 1.40,
    balance: 0.007,
    rateUsd: 1680.00,
    valueUsd: 11.76,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 14 }, { x: 50, y: 13 }, { x: 100, y: 11 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'LDO',
    name: 'Lido DAO',
    change24h: -3.50,
    balance: 7.2,
    rateUsd: 1.35,
    valueUsd: 9.72,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 10 }, { x: 50, y: 14 }, { x: 100, y: 17 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'SUSHI',
    name: 'SushiSwap',
    change24h: 2.75,
    balance: 11.5,
    rateUsd: 0.78,
    valueUsd: 8.97,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 16 }, { x: 50, y: 13 }, { x: 100, y: 10 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'BAL',
    name: 'Balancer',
    change24h: -1.15,
    balance: 4.6,
    rateUsd: 1.75,
    valueUsd: 8.05,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 13 }, { x: 50, y: 14 }, { x: 100, y: 15 }],
    chain: 'Base',
    selected: true,
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    change24h: 8.20,
    balance: 850000,
    rateUsd: 0.0000095,
    valueUsd: 8.07,
    iconType: 'generic',
    sparkline: [{ x: 0, y: 19 }, { x: 50, y: 13 }, { x: 100, y: 7 }],
    chain: 'Base',
    selected: true,
  },
];

interface AquaSweepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSweepSuccess?: (totalUsdc: number, count: number) => void;
  userAddress?: string;
}

export const AquaSweepModal: React.FC<AquaSweepModalProps> = ({
  isOpen,
  onClose,
  onSweepSuccess,
  userAddress = '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01',
}) => {
  const [coinList, setCoinList] = useState<ExtendedAquaCoin[]>(ALL_18_COINS);
  const [targetToken, setTargetToken] = useState<'USDC' | 'ETH'>('USDC');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedCoins = coinList.filter((c) => c.selected);
  const totalSelectedValueUsd = selectedCoins.reduce((sum, c) => sum + c.valueUsd, 0);
  const estimatedOutput = targetToken === 'USDC' 
    ? (totalSelectedValueUsd * 0.998).toFixed(2)
    : (totalSelectedValueUsd / 3120).toFixed(4);

  const toggleSelectCoin = (symbol: string) => {
    setCoinList((prev) =>
      prev.map((c) => (c.symbol === symbol ? { ...c, selected: !c.selected } : c))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = coinList.every((c) => c.selected);
    setCoinList((prev) => prev.map((c) => ({ ...c, selected: !allSelected })));
  };

  const handleExecuteAquaSweep = async () => {
    if (selectedCoins.length === 0) return;
    setIsExecuting(true);
    try {
      // 1inch Fusion gasless Dutch auction sweep simulation
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const fakeTx = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setTxHash(fakeTx);
      setIsCompleted(true);
      if (onSweepSuccess) {
        onSweepSuccess(parseFloat(estimatedOutput), selectedCoins.length);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#121216] border border-zinc-800 text-zinc-100 rounded-[32px] max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
              💧
            </div>
            <div>
              <div className="text-base font-bold text-white flex items-center space-x-2">
                <span>1inch Aqua App</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Fusion Sweeper
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gasless small balance aggregator &amp; MEV-protected swap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {!isCompleted ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Target Token Switcher */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div className="text-xs font-medium text-zinc-300">
                Sweep target currency:
              </div>
              <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTargetToken('USDC')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    targetToken === 'USDC'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  USDC
                </button>
                <button
                  type="button"
                  onClick={() => setTargetToken('ETH')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    targetToken === 'ETH'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ETH
                </button>
              </div>
            </div>

            {/* Selection Toolbar */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-zinc-400">
                Found <span className="text-white font-bold">{coinList.length}</span> small balances (~${coinList.reduce((a, b) => a + b.valueUsd, 0).toFixed(2)})
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                {coinList.every((c) => c.selected) ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            {/* Coins List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {coinList.map((coin) => (
                <div
                  key={coin.symbol}
                  onClick={() => toggleSelectCoin(coin.symbol)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    coin.selected
                      ? 'bg-cyan-950/20 border-cyan-800/60 text-white'
                      : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                        coin.selected
                          ? 'bg-cyan-500 border-cyan-400 text-black'
                          : 'border-zinc-700 bg-zinc-950'
                      }`}
                    >
                      {coin.selected && <Check size={13} strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>{coin.symbol}</span>
                        <span className="text-[10px] text-zinc-500 font-normal">
                          {coin.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {coin.balance} {coin.symbol}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-zinc-200">
                      ${coin.valueUsd.toFixed(2)}
                    </div>
                    <div
                      className={`text-[10px] font-mono ${
                        coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {coin.change24h >= 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 1inch Fusion Gasless Info Card */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 flex items-center space-x-1.5">
                  <Zap size={14} className="text-cyan-400" />
                  <span>1inch Fusion Gas Fee</span>
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  $0.00 (100% Free)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 flex items-center space-x-1.5">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  <span>MEV &amp; Slippage Protection</span>
                </span>
                <span className="text-cyan-300 font-medium">
                  Active (Dutch Auction)
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-cyan-900/40 text-[13px] font-bold">
                <span className="text-white">Estimated Output</span>
                <span className="text-cyan-400 font-mono">
                  ~{estimatedOutput} {targetToken}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Completed Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white tracking-tight">
                Aqua Sweep Successful!
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Consolidated {selectedCoins.length} small balances into {estimatedOutput} {targetToken} via 1inch Fusion.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Target:</span>
                <span className="text-white font-bold">{targetToken} on Base</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount Received:</span>
                <span className="text-cyan-400 font-bold">+{estimatedOutput} {targetToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Gas Saved:</span>
                <span className="text-emerald-400 font-bold">~$6.40 USD (0 gas)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tx Hash:</span>
                <span className="text-zinc-300 truncate max-w-[180px]">{txHash}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors shadow"
            >
              Done
            </button>
          </div>
        )}

        {/* Footer */}
        {!isCompleted && (
          <div className="p-5 border-t border-zinc-800 bg-zinc-950/60 space-y-3">
            <button
              type="button"
              onClick={handleExecuteAquaSweep}
              disabled={isExecuting || selectedCoins.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 active:scale-[0.99]"
            >
              {isExecuting ? (
                <>
                  <Loader2 size={18} className="animate-spin text-black" />
                  <span>Sweeping via 1inch Fusion...</span>
                </>
              ) : (
                <>
                  <span>
                    Sweep {selectedCoins.length} Coins to {targetToken} (~${totalSelectedValueUsd.toFixed(2)})
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
