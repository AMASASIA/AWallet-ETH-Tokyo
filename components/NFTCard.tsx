import React, { useState } from 'react';
import { ExternalLink, Sparkles, X, ShieldCheck } from 'lucide-react';
import { NFTItem } from '../types';

interface NFTCardProps {
  nft: NFTItem;
  ethPriceUsd?: number;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, ethPriceUsd = 3120 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const estimatedUsd = nft.estimatedUsd || nft.floorPriceEth * ethPriceUsd;

  return (
    <>
      {/* 2-Column Responsive Card Item */}
      <div
        onClick={() => setIsOpen(true)}
        className="group flex flex-col bg-zinc-950/90 border border-zinc-900 hover:border-zinc-700 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-sm"
      >
        {/* NFT Image Preview with Network & Rarity Badges */}
        <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Top Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-medium text-white border border-white/10">
              {nft.network}
            </span>
            {nft.rarity && (
              <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 backdrop-blur-md text-[10px] font-mono font-semibold text-zinc-300 border border-zinc-700/50 flex items-center space-x-1">
                <Sparkles size={10} className="text-amber-400" />
                <span>{nft.rarity}</span>
              </span>
            )}
          </div>
        </div>

        {/* Card Info Content */}
        <div className="p-3 flex flex-col justify-between flex-1">
          <div>
            <p className="text-[11px] font-medium text-zinc-400 truncate">
              {nft.collectionName}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
                {nft.name}
              </h3>
              <span className="text-[11px] font-mono text-zinc-500 flex-shrink-0 ml-1">
                {nft.tokenId}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-zinc-900/80 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-medium">Floor</span>
            <div className="text-right">
              <span className="text-xs font-mono font-semibold text-white">
                {nft.floorPriceEth} ETH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Detail Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-900">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-mono text-zinc-400">{nft.collectionName}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 space-y-4">
              {/* Full Image */}
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Valuation */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white tracking-tight">{nft.name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {nft.tokenId}
                  </span>
                </div>
                {nft.description && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {nft.description}
                  </p>
                )}
              </div>

              {/* Price Evaluation Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Floor Value</p>
                  <p className="text-base font-mono font-bold text-white mt-0.5">
                    {nft.floorPriceEth} ETH
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Est. USD</p>
                  <p className="text-sm font-mono font-semibold text-zinc-200 mt-0.5">
                    ${estimatedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Metadata & Traits */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Properties &amp; Details</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 uppercase block font-medium">Rarity Tier</span>
                    <span className="text-xs font-semibold text-white mt-0.5 flex items-center space-x-1">
                      <Sparkles size={11} className="text-amber-400" />
                      <span>{nft.rarity || 'Common'}</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 uppercase block font-medium">Network</span>
                    <span className="text-xs font-semibold text-white mt-0.5 flex items-center space-x-1">
                      <ShieldCheck size={11} className="text-blue-400" />
                      <span>{nft.network} Mainnet</span>
                    </span>
                  </div>
                </div>

                {nft.attributes && nft.attributes.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {nft.attributes.map((attr, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-900 text-center">
                        <span className="text-[9px] text-zinc-500 uppercase block truncate">{attr.trait_type}</span>
                        <span className="text-[11px] font-medium text-white truncate block mt-0.5">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {nft.contractAddress && (
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>Contract</span>
                    <span className="text-zinc-400 flex items-center space-x-1">
                      <span>{nft.contractAddress}</span>
                      <ExternalLink size={10} />
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-zinc-900 bg-zinc-950">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
