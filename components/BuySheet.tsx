import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';

interface BuySheetProps {
  onClose: () => void;
  onConfirmBuy: (amount: number, symbol: string) => void;
}

export const BuySheet: React.FC<BuySheetProps> = ({ onClose, onConfirmBuy }) => {
  const [amountUsd, setAmountUsd] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const presets = [50, 100, 250, 500];

  const handleBuy = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirmBuy(amountUsd, 'USDC');
      setIsProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="font-semibold text-sm tracking-tight">Buy Crypto</span>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-6">
        <div className="space-y-6 pt-4">
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">You Pay</p>
            <div className="text-5xl font-light tracking-tight font-mono">
              ${amountUsd}
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">
              Receive ≈ {amountUsd}.00 USDC on Base L2
            </p>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-2 pt-4">
            {presets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmountUsd(val)}
                className={`py-2.5 rounded-xl text-xs font-mono transition-colors ${
                  amountUsd === val
                    ? 'bg-white text-black font-semibold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>

          {/* Payment Method Details */}
          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Payment Method</span>
              <div className="flex items-center space-x-1.5 text-zinc-200">
                <CreditCard size={14} />
                <span>Card / Apple Pay</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Network</span>
              <span className="text-zinc-200 font-mono">Base Mainnet</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Network Fee</span>
              <span className="text-zinc-400 font-mono">$0.01 (Subsidized)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pb-4">
          <button
            type="button"
            onClick={handleBuy}
            disabled={isProcessing || success}
            className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {success ? (
              <>
                <Check size={16} />
                <span>Added to Wallet!</span>
              </>
            ) : isProcessing ? (
              <span>Authorizing Payment...</span>
            ) : (
              <span>Pay ${amountUsd} with Card</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
