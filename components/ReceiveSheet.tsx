import React, { useState } from 'react';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ReceiveSheetProps {
  address: string;
  baseName?: string;
  onClose: () => void;
}

export const ReceiveSheet: React.FC<ReceiveSheetProps> = ({ address, baseName, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="font-semibold text-sm tracking-tight">Receive</span>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-between max-w-md w-full mx-auto p-6 text-center">
        <div className="w-full flex flex-col items-center pt-4">
          <p className="text-xs text-zinc-500 mb-6">
            Only send Base assets (ETH, USDC, ERC-20) to this address
          </p>

          {/* QR Code Container */}
          <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl mb-8">
            <QRCode value={address} size={200} />
          </div>

          {/* Identifier labels */}
          {baseName && (
            <p className="text-base font-semibold text-white tracking-tight mb-1">
              {baseName}
            </p>
          )}

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl px-4 py-3 max-w-xs w-full">
            <p className="text-xs font-mono text-zinc-400 break-all leading-relaxed">
              {address}
            </p>
          </div>
        </div>

        {/* Copy Button */}
        <div className="w-full pb-4">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center space-x-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Address'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
