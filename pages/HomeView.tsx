import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  ArrowLeftRight, 
  ArrowLeft,
  ShieldCheck, 
  Layers, 
  ChevronRight,
  QrCode,
  Fingerprint,
  Copy,
  Check,
  X,
  ExternalLink,
  Droplet
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { InvisibleAction, NFTItem, Token } from '../types';
import { TokenRow } from '../components/TokenRow';
import { NFTCard } from '../components/NFTCard';
import { INITIAL_NFTS } from '../services/mockChain';

interface HomeViewProps {
  totalBalanceUsd: number;
  userAddress: string;
  baseName?: string;
  userDid?: string;
  tokens: Token[];
  nfts?: NFTItem[];
  invisibleActions?: InvisibleAction[];
  isMainnet?: boolean;
  onToggleNetwork?: () => void;
  onClaimFaucet?: () => void;
  onOpenSend: () => void;
  onOpenSwap: (initialTokenSymbol?: string) => void;
  onOpenReceive: () => void;
  onOpenBuy: () => void;
  onOpenInvisibleFinance?: () => void;
  onOpenTiveDashboard?: () => void;
  onOpenAqua?: () => void;
  onOpenIdentity?: () => void;
  onOpenProposalScanner?: () => void;
  onSimulateSampleAction?: (desc: string, amount: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  totalBalanceUsd,
  userAddress,
  baseName,
  userDid = 'did:ion:EiClW...z8p9J',
  tokens,
  nfts = INITIAL_NFTS,
  invisibleActions = [],
  isMainnet = true,
  onToggleNetwork,
  onClaimFaucet,
  onOpenSend,
  onOpenSwap,
  onOpenReceive,
  onOpenBuy,
  onOpenInvisibleFinance,
  onOpenTiveDashboard,
  onOpenAqua,
  onOpenIdentity,
}) => {
  const [activeAssetTab, setActiveAssetTab] = useState<'tokens' | 'nfts'>('tokens');
  const [showDidModal, setShowDidModal] = useState(false);
  const [copiedDid, setCopiedDid] = useState(false);
  const [showQrOverlay, setShowQrOverlay] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [faucetClaimed, setFaucetClaimed] = useState(false);

  const awaitingActions = invisibleActions.filter((a) => a.status === 'awaiting');

  const handleCopyDid = () => {
    navigator.clipboard.writeText(userDid);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleClaimFaucet = () => {
    if (onClaimFaucet) {
      onClaimFaucet();
      setFaucetClaimed(true);
      setTimeout(() => setFaucetClaimed(false), 3000);
    }
  };

  const nftTotalUsd = nfts.reduce(
    (acc, nft) => acc + (nft.estimatedUsd || nft.floorPriceEth * 3120),
    0
  );
  const displayedBalance = activeAssetTab === 'tokens' ? totalBalanceUsd : nftTotalUsd;

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Top Header: Brand & Identity + Network Switcher */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-sm font-mono flex items-center justify-center shadow-sm">
            A
          </div>
          <span className="font-semibold text-base tracking-tight text-white">AWallet</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Network Switcher Toggle Button */}
          {onToggleNetwork && (
            <button
              onClick={onToggleNetwork}
              className={`px-2.5 py-1.5 rounded-full border text-[11px] font-mono font-medium flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                isMainnet 
                  ? 'bg-zinc-950 border-emerald-900/60 text-emerald-400 hover:border-emerald-700' 
                  : 'bg-zinc-950 border-amber-900/60 text-amber-400 hover:border-amber-700'
              }`}
              title="Switch Network (Mainnet / Testnet)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isMainnet ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{isMainnet ? 'Base' : 'Sepolia'}</span>
            </button>
          )}

          {/* Address or BaseName chip with Fingerprint DID function */}
          <button
            onClick={() => setShowDidModal(true)}
            className="px-3 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center space-x-2 transition-all active:scale-95 group shadow-sm cursor-pointer"
            title="Soul Identity (DID)"
          >
            <div className="w-5 h-5 rounded-full bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
              <Fingerprint size={12} />
            </div>
            <span className="font-semibold">{baseName || `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>
        </div>
      </div>

      {/* Hero: Balance Centered */}
      <div className="text-center py-6">
        <p className="text-[11px] text-zinc-500 font-semibold tracking-widest uppercase mb-1.5">
          {activeAssetTab === 'tokens' ? 'TOTAL BALANCE' : 'ESTIMATED NFT VALUE'}
        </p>
        <h1 className="text-5xl font-light text-white tracking-tight font-mono transition-all">
          ${displayedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
        <div className="text-xs text-zinc-500 font-mono mt-2 flex items-center justify-center space-x-1.5">
          {activeAssetTab === 'tokens' ? (
            <>
              <ShieldCheck size={14} className="text-zinc-400" />
              <span>{isMainnet ? 'Base Smart Wallet' : 'Base Sepolia Smart Wallet'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isMainnet ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' : 'bg-amber-950/60 text-amber-400 border border-amber-900/50'}`}>
                {isMainnet ? 'Mainnet' : 'Testnet'}
              </span>
            </>
          ) : (
            <>
              <Layers size={14} className="text-zinc-400" />
              <span>{nfts.length} Verified Collections</span>
            </>
          )}
        </div>
      </div>

      {/* Circular Action Buttons: Send, Swap (1inch), Receive, Buy/Faucet */}
      <div className="flex items-center justify-center gap-6 py-2">
        {/* Send */}
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenSend}
            className="w-14 h-14 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white transition-colors cursor-pointer active:scale-95"
            aria-label="Send"
          >
            <ArrowUpRight size={22} />
          </button>
          <span className="text-xs font-medium text-zinc-300 mt-2">Send</span>
        </div>

        {/* Swap with 1inch badge */}
        <div className="flex flex-col items-center relative">
          <button
            onClick={() => onOpenSwap()}
            className="w-14 h-14 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white transition-colors cursor-pointer active:scale-95 group relative"
            aria-label="Swap"
          >
            <ArrowLeftRight size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="absolute -top-1 -right-1 text-[9px] font-mono px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              1inch
            </span>
          </button>
          <span className="text-xs font-medium text-zinc-300 mt-2">Swap</span>
        </div>

        {/* Receive */}
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenReceive}
            className="w-14 h-14 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white transition-colors cursor-pointer active:scale-95"
            aria-label="Receive"
          >
            <ArrowDownLeft size={22} />
          </button>
          <span className="text-xs font-medium text-zinc-300 mt-2">Receive</span>
        </div>

        {/* Buy (Mainnet) or Faucet (Testnet) */}
        <div className="flex flex-col items-center">
          {isMainnet ? (
            <button
              onClick={onOpenBuy}
              className="w-14 h-14 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white transition-colors cursor-pointer active:scale-95"
              aria-label="Buy"
            >
              <Plus size={22} strokeWidth={2.2} />
            </button>
          ) : (
            <button
              onClick={handleClaimFaucet}
              className="w-14 h-14 rounded-full bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80 flex items-center justify-center text-amber-300 transition-colors cursor-pointer active:scale-95"
              aria-label="Testnet Faucet"
              title="Claim Free Sepolia ETH"
            >
              <Droplet size={20} className="animate-pulse" />
            </button>
          )}
          <span className="text-xs font-medium text-zinc-300 mt-2">
            {isMainnet ? 'Buy' : 'Faucet'}
          </span>
        </div>
      </div>

      {/* Testnet Faucet Quick Notification Bar */}
      {!isMainnet && (
        <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300 font-mono">Base Sepolia (84532)</span>
          </div>
          <button
            onClick={handleClaimFaucet}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
          >
            {faucetClaimed ? '✓ Claimed +0.5 ETH' : '+ Get 0.5 ETH Faucet'}
          </button>
        </div>
      )}

      {/* 1inch Aqua App Wide Horizontal Button (Positioned directly ABOVE Tive ◉AI) */}
      {onOpenAqua && (
        <div className="pt-2">
          <button
            onClick={onOpenAqua}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-zinc-950 to-blue-950/40 border border-cyan-800/50 hover:border-cyan-500/80 text-left transition-all active:scale-[0.99] group cursor-pointer shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <Droplet size={18} className="text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-white">1inch Aqua App</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-medium">
                    18 coins
                  </span>
                  <span className="text-[10px] text-cyan-400/80 font-mono">
                    残高一括集約
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Small balances sweep · Zero gas via Resolvers
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-cyan-400 text-xs font-medium pl-2">
              <span className="font-mono text-[11px]">Aqua</span>
              <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* Tive ◉AI Entry Cards (Exact match to previous clean UI) */}
      <div className="pt-1 space-y-2">
        {onOpenInvisibleFinance && (
          <button
            onClick={onOpenInvisibleFinance}
            className="w-full flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 hover:border-zinc-700 px-4 py-3 text-left transition-all active:scale-[0.99] shadow-sm group cursor-pointer"
          >
            <div className="h-9 w-9 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow text-lg font-bold select-none leading-none">
              ◉
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white flex items-center space-x-2">
                <span>Tive ◉AI</span>
                <span className="text-zinc-600">·</span>
                {awaitingActions.length > 0 ? (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    3件の承認待ち
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    待機中
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400 truncate mt-0.5">
                {awaitingActions.length > 0 
                  ? 'コーヒーTipping / ART credit ・ ¥480'
                  : 'AI Orchestration · Policy Engine'}
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
          </button>
        )}

        {onOpenTiveDashboard && (
          <button
            onClick={onOpenTiveDashboard}
            className="w-full flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 hover:border-zinc-700 px-4 py-3 text-left transition-all active:scale-[0.99] shadow-sm group cursor-pointer"
          >
            <div className="h-9 w-9 rounded-full bg-zinc-900 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0 shadow text-base font-bold select-none leading-none">
              ◉
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white flex items-center space-x-2">
                <span>Tive ◉AI 資産マネジメント</span>
                <span className="text-zinc-600">·</span>
                <span className="text-emerald-400 font-mono text-[11px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  オートメーション稼働中
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                Vault運用 · Policy Engineティア制御 · リアル...
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0" />
          </button>
        )}
      </div>

      {/* Pill Tab Switcher: Tokens vs NFTs & QR Function */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center p-1 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-inner">
          <button
            onClick={() => setActiveAssetTab('tokens')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeAssetTab === 'tokens'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Tokens
          </button>
          <button
            onClick={() => setActiveAssetTab('nfts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeAssetTab === 'nfts'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            NFTs
          </button>
        </div>

        <button
          onClick={() => setShowQrOverlay(true)}
          className="h-[38px] px-3 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 shadow-inner cursor-pointer group"
          title="Show Wallet QR Code"
          aria-label="Show Wallet QR Code"
        >
          <QrCode size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
          <span>QR</span>
        </button>
      </div>

      {/* Dynamic Content: Tokens List or NFTs Grid */}
      {activeAssetTab === 'tokens' ? (
        <div className="space-y-2 pt-1">
          {tokens.map((token) => (
            <TokenRow
              key={token.symbol}
              token={token}
              onClick={() => onOpenSwap(token.symbol)}
              onSwapClick={() => onOpenSwap(token.symbol)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {nfts.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}

      {/* DID Identity Modal */}
      {showDidModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                  <Fingerprint size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Soul Identity (DID)</h3>
                  <p className="text-[11px] text-zinc-500 font-mono">{baseName || 'alex.base.eth'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDidModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">DID Identifier</span>
                <button
                  onClick={handleCopyDid}
                  className="flex items-center space-x-1 font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedDid ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span className="text-[11px]">Copy DID</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-mono text-white break-all bg-black/40 p-2.5 rounded-xl border border-zinc-800">
                {userDid}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500">Passkey / WebAuthn</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active (TouchID)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500">Controller Address</span>
                <span className="font-mono text-zinc-300 text-[11px]">
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              {onOpenIdentity && (
                <button
                  onClick={() => {
                    setShowDidModal(false);
                    onOpenIdentity();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow cursor-pointer"
                >
                  <span>SBT Details</span>
                  <ExternalLink size={12} />
                </button>
              )}
              <button
                onClick={() => setShowDidModal(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen QR Code Overlay */}
      {showQrOverlay && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in">
          <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900">
            <button
              onClick={() => setShowQrOverlay(false)}
              className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <ArrowLeft size={22} />
            </button>
            <span className="font-semibold text-sm tracking-tight">Receive &amp; QR</span>
            <button
              onClick={() => setShowQrOverlay(false)}
              className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-between max-w-md w-full mx-auto p-6 text-center">
            <div className="w-full flex flex-col items-center pt-4">
              <p className="text-xs text-zinc-500 mb-6">
                Scan QR to receive tokens on {isMainnet ? 'Base' : 'Base Sepolia'}
              </p>

              <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl mb-8">
                <QRCode value={userAddress} size={200} />
              </div>

              {baseName && (
                <p className="text-base font-semibold text-white tracking-tight mb-1">
                  {baseName}
                </p>
              )}

              <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl px-4 py-3 max-w-xs w-full">
                <p className="text-xs font-mono text-zinc-400 break-all leading-relaxed">
                  {userAddress}
                </p>
              </div>
            </div>

            <div className="w-full space-y-3 pb-4">
              <button
                onClick={handleCopyAddress}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-95 shadow cursor-pointer"
              >
                {copiedAddress ? (
                  <>
                    <Check size={18} className="text-black" />
                    <span>Copied Address</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copy Address</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowQrOverlay(false)}
                className="w-full py-3 rounded-2xl border border-zinc-900 text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
