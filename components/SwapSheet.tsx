import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowDown, RefreshCw, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { Token, PolicyEngineConfig, FusionQuote } from '../types';
import { getFusionQuote, fetchFusionQuoteAsync, submitFusionOrder, BASE_FUSION_SETTLEMENT_ADDRESS } from '../services/oneinchFusion';
import { evaluateTransactionPolicy } from '../services/sessionPolicyEngine';
import { getChainAdapter } from '../services/chainAdapters';
import { FusionPriceImpactChart } from './FusionPriceImpactChart';

interface SwapSheetProps {
  tokens: Token[];
  policyConfig: PolicyEngineConfig;
  userAddress: string;
  initialTokenSymbol?: string;
  onClose: () => void;
  onSwapCompleted: (fromSymbol: string, toSymbol: string, fromAmount: number, toAmount: number, spentUsd: number) => void;
  onTripCircuitBreaker: (reason: string) => void;
}

export const SwapSheet: React.FC<SwapSheetProps> = ({
  tokens,
  policyConfig,
  userAddress,
  initialTokenSymbol,
  onClose,
  onSwapCompleted,
  onTripCircuitBreaker,
}) => {
  const [fromSymbol, setFromSymbol] = useState(initialTokenSymbol || (tokens[0]?.symbol || 'ETH'));
  const [toSymbol, setToSymbol] = useState(
    initialTokenSymbol === 'USDC' ? (tokens[0]?.symbol || 'ETH') : 'USDC'
  );
  const [amount, setAmount] = useState('0.1');
  const [isSwapping, setIsSwapping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Using the ChainAdapter pattern for Base 1inch Fusion
  const adapter = getChainAdapter(8453);

  const fromToken = tokens.find((t) => t.symbol === fromSymbol) || tokens[0];
  const toToken = tokens.find((t) => t.symbol === toSymbol) || tokens[1] || tokens[0];
  const parsedAmount = parseFloat(amount) || 0;

  // 1inch Fusion Quote via ChainAdapter (Synchronous immediate estimation)
  const initialQuote = useMemo(() => {
    return adapter.getFusionQuote ? adapter.getFusionQuote(fromToken, toToken, parsedAmount) : getFusionQuote(fromToken, toToken, parsedAmount);
  }, [adapter, fromToken, toToken, parsedAmount]);

  const [liveQuote, setLiveQuote] = useState<FusionQuote | null>(null);

  // Fetch live server-verified quote from Express /api/swap/quote proxy
  useEffect(() => {
    let active = true;
    if (parsedAmount > 0) {
      fetchFusionQuoteAsync(fromToken, toToken, parsedAmount, userAddress).then((res) => {
        if (active) setLiveQuote(res);
      });
    } else {
      setLiveQuote(null);
    }
    return () => {
      active = false;
    };
  }, [fromToken, toToken, parsedAmount, userAddress]);

  const quote = liveQuote || initialQuote;

  const fromPrice = fromToken.priceUsd || (fromToken.symbol === 'ETH' ? 3120 : fromToken.symbol === 'cbBTC' ? 68000 : 1);
  const spentUsd = parsedAmount * fromPrice;

  // Evaluate against Session Key & Policy Engine
  const policyResult = useMemo(() => {
    return evaluateTransactionPolicy(spentUsd, BASE_FUSION_SETTLEMENT_ADDRESS, policyConfig);
  }, [spentUsd, policyConfig]);

  const handleInvertTokens = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
  };

  const handleSetMax = () => {
    setAmount(fromToken.balance.toString());
  };

  const handleExecuteSwap = async () => {
    if (parsedAmount <= 0) {
      setErrorMsg('Enter a valid swap amount');
      return;
    }
    if (parsedAmount > fromToken.balance) {
      setErrorMsg(`Insufficient ${fromToken.symbol} balance`);
      return;
    }

    if (policyResult.circuitBreakerTriggered) {
      onTripCircuitBreaker(policyResult.reason || 'Circuit Breaker Triggered');
      setErrorMsg(policyResult.reason || 'Circuit Breaker Triggered');
      return;
    }

    setIsSwapping(true);
    setErrorMsg(null);
    try {
      if (adapter.executeFusionSwap) {
        await adapter.executeFusionSwap(quote, userAddress);
      } else {
        await submitFusionOrder(quote, userAddress);
      }
      onSwapCompleted(fromSymbol, toSymbol, parsedAmount, quote.toAmount, spentUsd);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to place 1inch Fusion order');
      }
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900">
        <button
          onClick={onClose}
          disabled={isSwapping}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-sm tracking-tight">1inch Fusion Swap</span>
          <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded">Base</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-5 overflow-y-auto">
        <div className="space-y-4">
          {/* Circuit Breaker Banner if Tripped */}
          {policyConfig.circuitBreakerStatus === 'TRIPPED' && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white flex items-start space-x-2.5">
              <AlertTriangle size={16} className="text-white flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Circuit Breaker Active</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{policyConfig.circuitBreakerReason || 'Emergency pause active. Swaps disabled.'}</p>
              </div>
            </div>
          )}

          {/* Pay Input Box */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span>You Pay</span>
              <div className="flex items-center space-x-1 font-mono">
                <span>Bal: {fromToken.balance.toLocaleString()} {fromToken.symbol}</span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-white underline ml-1"
                >
                  Max
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent text-3xl font-light w-1/2 focus:outline-none placeholder:text-zinc-700 font-mono"
              />
              <select
                value={fromSymbol}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === toSymbol) setToSymbol(fromSymbol);
                  setFromSymbol(val);
                }}
                className="bg-zinc-900 border border-zinc-800 text-white font-semibold text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                {tokens.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-zinc-500 font-mono">
              ≈ ${spentUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </p>
          </div>

          {/* Invert Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleInvertTokens}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center justify-center transition-colors shadow-sm"
              aria-label="Invert Tokens"
            >
              <ArrowDown size={16} />
            </button>
          </div>

          {/* Receive Output Box */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span>You Receive (Estimated)</span>
              <span className="font-mono">Bal: {toToken.balance.toLocaleString()} {toToken.symbol}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-3xl font-light font-mono text-zinc-200">
                {quote.toAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </div>
              <select
                value={toSymbol}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === fromSymbol) setFromSymbol(toSymbol);
                  setToSymbol(val);
                }}
                className="bg-zinc-900 border border-zinc-800 text-white font-semibold text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                {tokens.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 font-mono">
                Rate: 1 {fromToken.symbol} ≈ {quote.rate.toFixed(4)} {toToken.symbol}
              </p>
              {quote.simulated && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  <Zap size={10} className="text-cyan-400" /> 1inch Fusion Route
                </span>
              )}
            </div>
          </div>

          {/* Recharts Price Impact & Execution Efficiency Chart */}
          <FusionPriceImpactChart
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={parsedAmount}
            spentUsd={spentUsd}
            auctionDurationSec={quote.auctionDurationSec || 120}
          />

          {/* 1inch Fusion Protocol Highlights */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Route</span>
              <span className="text-white font-medium flex items-center gap-1 font-mono">
                <Zap size={13} className="text-cyan-400" /> 1inch Fusion
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Gas Fee</span>
              <span className="text-emerald-400 font-mono font-semibold">$0.00 (Gasless)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">MEV Protection</span>
              <span className="text-zinc-300 flex items-center gap-1 font-mono">
                <ShieldCheck size={13} className="text-emerald-400" /> Active
              </span>
            </div>

            {/* Policy Engine Evaluation Feedback */}
            <div className="pt-2 border-t border-zinc-900">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Policy Engine:</span>
                {policyResult.sessionKeyEligible ? (
                  <span className="text-emerald-400 font-mono">Verified (Zero-Click)</span>
                ) : policyResult.requiresGuardianApproval ? (
                  <span className="text-amber-400 font-mono">Manual Signing Required</span>
                ) : (
                  <span className="text-zinc-300 font-mono">Verified</span>
                )}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-rose-400">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 pb-2">
          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={isSwapping || policyConfig.circuitBreakerStatus === 'TRIPPED' || parsedAmount <= 0 || parsedAmount > fromToken.balance}
            className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            {isSwapping ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Broadcasting to 1inch Resolvers...</span>
              </>
            ) : policyConfig.circuitBreakerStatus === 'TRIPPED' ? (
              <span>Swaps Blocked by Circuit Breaker</span>
            ) : (
              <span>Swap with 1inch Fusion (0 Gas)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
