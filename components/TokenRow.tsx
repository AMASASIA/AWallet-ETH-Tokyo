import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Token } from '../types';

interface TokenRowProps {
  token: Token;
  onClick?: () => void;
  onSwapClick?: (e: React.MouseEvent) => void;
}

export const TokenRow: React.FC<TokenRowProps> = ({ token, onClick, onSwapClick }) => {
  const price = token.priceUsd || (token.symbol === 'ETH' ? 3120 : token.symbol === 'cbBTC' ? 68000 : 1);
  const usdValue = token.balance * price;

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-900 hover:border-zinc-800 cursor-pointer transition-all active:scale-[0.99]"
    >
      {/* Left: Token Monogram & Name */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-white flex-shrink-0">
          {token.symbol.slice(0, 3)}
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-sm font-semibold text-white">{token.name}</span>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            {token.balance.toLocaleString()} {token.symbol}
          </p>
        </div>
      </div>

      {/* Right: USD Valuation & 1inch Swap Button */}
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-white font-mono">
            ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            ${price.toLocaleString()}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSwapClick) {
              onSwapClick(e);
            } else if (onClick) {
              onClick();
            }
          }}
          className="h-8 px-2.5 rounded-xl bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800 text-zinc-400 group-hover:text-white flex items-center space-x-1 text-[11px] font-medium transition-colors"
          title="1inch Fusion Swap"
        >
          <ArrowLeftRight size={12} className="text-zinc-400 group-hover:text-cyan-400 transition-colors" />
          <span className="font-mono text-[10px]">1inch</span>
        </button>
      </div>
    </div>
  );
};

