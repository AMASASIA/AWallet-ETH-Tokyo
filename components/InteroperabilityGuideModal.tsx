import React, { useState } from 'react';
import { ArrowLeft, X, ShieldCheck, QrCode, Globe, Check, ExternalLink, Cpu, Lock } from 'lucide-react';

interface InteroperabilityGuideModalProps {
  onClose: () => void;
}

export const InteroperabilityGuideModal: React.FC<InteroperabilityGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'eip1193' | 'eip681' | 'import'>('eip1193');

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col text-white animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900 bg-black shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center space-x-2">
          <Globe size={16} className="text-zinc-400" />
          <span className="font-semibold text-sm tracking-tight text-white">
            Interoperability &amp; Standards
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-900 bg-zinc-950 px-4 shrink-0 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('eip1193')}
          className={`py-3 px-3 border-b-2 font-medium transition-colors ${
            activeTab === 'eip1193'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          EIP-1193 (Provider API)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('eip681')}
          className={`py-3 px-3 border-b-2 font-medium transition-colors ${
            activeTab === 'eip681'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          EIP-681 (QR &amp; URIs)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`py-3 px-3 border-b-2 font-medium transition-colors ${
            activeTab === 'import'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Account Import &amp; dApps
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg w-full mx-auto space-y-5 text-zinc-300 text-xs leading-relaxed">
        {/* TAB 1: EIP-1193 */}
        {activeTab === 'eip1193' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
              <div className="flex items-center space-x-2 text-white">
                <Cpu size={16} className="text-zinc-400" />
                <h3 className="font-semibold text-sm">Ethereum Provider JavaScript API (EIP-1193)</h3>
              </div>
              <p className="text-[11px] text-zinc-400">
                EIP-1193 defines the standard communication bridge (<code className="text-zinc-200 font-mono">window.ethereum</code>) between Web3 wallets and dApps.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-zinc-200 text-xs">How AWallet Interoperates:</h4>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-zinc-100 font-mono text-[11px]">
                  <Check size={13} className="text-emerald-400" />
                  <span>eth_requestAccounts</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Connects seamlessly to external Base wallets (Coinbase Wallet, MetaMask, Rabby) without exposing private keys.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-zinc-100 font-mono text-[11px]">
                  <Check size={13} className="text-emerald-400" />
                  <span>wallet_switchEthereumChain (0x2105)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Ensures automatic network synchronization with <strong>Base Mainnet</strong> (Chain ID 8453) and auto-prompts wallet chain addition (EIP-3085) if missing.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-zinc-100 font-mono text-[11px]">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Pre-execution Policy Engine</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Before transactions reach the EIP-1193 signing layer, AWallet's deterministic firewall audits the destination for address poisoning, zero-width characters, and spending caps.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EIP-681 */}
        {activeTab === 'eip681' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
              <div className="flex items-center space-x-2 text-white">
                <QrCode size={16} className="text-zinc-400" />
                <h3 className="font-semibold text-sm">URL Format for Transaction Requests (EIP-681)</h3>
              </div>
              <p className="text-[11px] text-zinc-400">
                EIP-681 standardizes payment URIs used in QR codes and deep links across the Ethereum and Base ecosystem.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-zinc-200 text-xs">Standard Syntax &amp; Parsing:</h4>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-1 overflow-x-auto">
                <p className="text-white">ethereum:&lt;address&gt;[?value=&lt;amount&gt;]</p>
                <p className="text-white">base:&lt;address&gt;</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2 text-[11px]">
                  <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-zinc-200 font-medium">Automatic Scheme Stripping: </span>
                    <span className="text-zinc-400">
                      Instantly cleans <code className="text-zinc-300 font-mono">ethereum:</code>, <code className="text-zinc-300 font-mono">base:</code>, and URL parameters when scanning with camera.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[11px]">
                  <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-zinc-200 font-medium">EIP-55 Checksum Verification: </span>
                    <span className="text-zinc-400">
                      Validates mixed-case Keccak-256 checksums to prevent mistyped addresses.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[11px]">
                  <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-zinc-200 font-medium">Anti-Bidi &amp; Zero-Width Sanitizer: </span>
                    <span className="text-zinc-400">
                      Strips invisible and RTL unicode overrides that attackers embed into malicious QR codes.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Account Import & dApps */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
              <div className="flex items-center space-x-2 text-white">
                <Lock size={16} className="text-zinc-400" />
                <h3 className="font-semibold text-sm">Importing Existing Base Accounts</h3>
              </div>
              <p className="text-[11px] text-zinc-400">
                AWallet connects to your existing accounts without asking for your private seed phrase.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-semibold text-xs text-white block">1. Coinbase Smart Wallet (Passkey)</span>
                <p className="text-[11px] text-zinc-400">
                  Select Coinbase Wallet to connect via Face ID or Touch ID. Create or use an existing Base smart wallet with instant biometrics.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-semibold text-xs text-white block">2. MetaMask &amp; Browser Extensions</span>
                <p className="text-[11px] text-zinc-400">
                  Use the standard Injected Web3 Provider to control accounts directly from your existing browser wallet.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-semibold text-xs text-white block">3. Interacting with Base dApps</span>
                <p className="text-[11px] text-zinc-400">
                  All transactions executed through AWallet produce standard EVM transaction receipts viewable on <strong>BaseScan</strong>, allowing cross-compatibility with Aerodrome, Uniswap, and OpenSea.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Standards: EIP-1193 · EIP-681 · EIP-55</span>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:underline font-medium"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
