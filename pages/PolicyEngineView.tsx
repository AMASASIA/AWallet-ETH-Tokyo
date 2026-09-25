import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, ShieldCheck, Key, Plus, Trash2, RefreshCw, Lock, CheckCircle } from 'lucide-react';
import { PolicyEngineConfig } from '../types';
import { createNewSessionKey } from '../services/sessionPolicyEngine';

interface PolicyEngineViewProps {
  config: PolicyEngineConfig;
  onBack: () => void;
  onUpdateConfig: (newConfig: PolicyEngineConfig) => void;
  onLogActivity: (detail: string, type: 'Policy' | 'Approval') => void;
}

export const PolicyEngineView: React.FC<PolicyEngineViewProps> = ({
  config,
  onBack,
  onUpdateConfig,
  onLogActivity,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newLimit, setNewLimit] = useState('75');
  const [newDuration, setNewDuration] = useState('7');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggleCircuitBreaker = () => {
    const nextStatus = config.circuitBreakerStatus === 'TRIPPED' ? 'NORMAL' : 'TRIPPED';
    const reason = nextStatus === 'TRIPPED' ? 'Emergency manual freeze by owner' : undefined;
    onUpdateConfig({
      ...config,
      circuitBreakerStatus: nextStatus,
      circuitBreakerReason: reason,
    });
    onLogActivity(
      nextStatus === 'TRIPPED' ? 'Circuit Breaker manually TRIPPED (freeze)' : 'Circuit Breaker RESET to NORMAL',
      'Policy'
    );
  };

  const handleToggleWhitelistOnly = () => {
    const nextState = !config.whitelistOnly;
    onUpdateConfig({
      ...config,
      whitelistOnly: nextState,
    });
    onLogActivity(
      nextState ? 'Whitelist-Only policy mode ENABLED' : 'Whitelist-Only policy mode DISABLED',
      'Policy'
    );
  };

  const handleResetDailySpend = () => {
    onUpdateConfig({
      ...config,
      dailySpentUsd: 0,
    });
    onLogActivity('Daily spend counter reset to $0.00', 'Policy');
  };

  const handleAddSessionKey = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(newLimit) || 50;
    const duration = parseInt(newDuration, 10) || 7;
    const newKey = createNewSessionKey(newLabel || 'Automated Session', limit, duration);

    onUpdateConfig({
      ...config,
      sessionKeys: [newKey, ...config.sessionKeys],
    });
    onLogActivity(`Created Session Key [${newKey.label}] with $${limit} limit`, 'Policy');
    setNewLabel('');
    setShowAddForm(false);
  };

  const handleRevokeKey = (id: string, label: string) => {
    onUpdateConfig({
      ...config,
      sessionKeys: config.sessionKeys.filter((k) => k.id !== id),
    });
    onLogActivity(`Revoked Session Key [${label}]`, 'Policy');
  };

  const dailyUsagePercent = Math.min(100, (config.dailySpentUsd / config.dailySpendCapUsd) * 100);

  return (
    <div className="space-y-6 pb-24 animate-fade-in text-white">
      {/* Top Header */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold tracking-tight">Policy Engine &amp; Circuit Breaker</h1>
          <p className="text-xs text-zinc-500 font-mono">ERC-4337 SessionKeyModule on Base</p>
        </div>
      </div>

      {/* Circuit Breaker Status Banner */}
      <div className={`p-4 rounded-2xl border ${
        config.circuitBreakerStatus === 'TRIPPED'
          ? 'bg-zinc-950 border-white text-white'
          : 'bg-zinc-950 border-zinc-900 text-zinc-300'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            {config.circuitBreakerStatus === 'TRIPPED' ? (
              <ShieldAlert size={20} className="text-white" />
            ) : (
              <ShieldCheck size={20} className="text-zinc-400" />
            )}
            <div>
              <p className="text-sm font-semibold">
                Status: {config.circuitBreakerStatus}
              </p>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {config.circuitBreakerStatus === 'TRIPPED'
                  ? config.circuitBreakerReason || 'Emergency pause active'
                  : 'Automated & Session Key transactions active'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleCircuitBreaker}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
              config.circuitBreakerStatus === 'TRIPPED'
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800'
            }`}
          >
            {config.circuitBreakerStatus === 'TRIPPED' ? 'Reset to Normal' : 'Trip Breaker'}
          </button>
        </div>
      </div>

      {/* Whitelist-Only Security Mode */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-white">Whitelist-Only Recipient Mode</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              config.whitelistOnly
                ? 'bg-zinc-900 border-white text-white'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
            }`}>
              {config.whitelistOnly ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            {config.whitelistOnly
              ? `Enforced: Transfers and contracts outside ${config.whitelistedContracts.length} approved targets will be blocked.`
              : 'Allow transactions to any valid recipient address.'}
          </p>
        </div>
        <button
          onClick={handleToggleWhitelistOnly}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
            config.whitelistOnly
              ? 'bg-white text-black hover:bg-zinc-200'
              : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800'
          }`}
        >
          {config.whitelistOnly ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Spending Limits & Progress */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-medium uppercase tracking-wider">Daily Spending Cap</span>
          <button
            onClick={handleResetDailySpend}
            className="text-zinc-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
          >
            <RefreshCw size={11} /> Reset Counter
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm font-mono">
            <span className="text-white">${config.dailySpentUsd.toFixed(2)} USD spent</span>
            <span className="text-zinc-500">Cap: ${config.dailySpendCapUsd.toFixed(2)}</span>
          </div>
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                dailyUsagePercent > 90 ? 'bg-white' : 'bg-zinc-400'
              }`}
              style={{ width: `${dailyUsagePercent}%` }}
            />
          </div>
        </div>

        <div className="pt-2 flex justify-between text-xs text-zinc-500 border-t border-zinc-900 font-mono">
          <span>Single Tx Session Max</span>
          <span className="text-zinc-300 font-semibold">${config.singleTxLimitUsd} USD</span>
        </div>
      </div>

      {/* Session Keys List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <Key size={14} className="text-zinc-500" />
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Active Session Keys ({config.sessionKeys.length})
            </h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-white font-mono flex items-center space-x-1 hover:underline"
          >
            <Plus size={13} />
            <span>New Key</span>
          </button>
        </div>

        {/* Add Key Form */}
        {showAddForm && (
          <form onSubmit={handleAddSessionKey} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <p className="text-xs font-semibold text-white">Issue Temporary Session Key</p>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. 1inch Fusion Bot"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Max per Tx ($)</label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Validity (Days)</label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200"
              >
                Issue Key
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {config.sessionKeys.map((key) => {
            const daysLeft = Math.max(0, Math.ceil((key.validUntil - Date.now()) / 86400000));
            return (
              <div
                key={key.id}
                className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">{key.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                      {key.publicKey}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Limit: ${key.singleTxLimitUsd}/tx • {daysLeft} days remaining
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeKey(key.id, key.label)}
                  className="p-2 text-zinc-600 hover:text-white transition-colors"
                  aria-label="Revoke Key"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exploit & Anti-Hacking Guard Status */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <h3 className="text-xs font-semibold text-white">Anti-Hacking &amp; Multi-Layer Defense</h3>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          AWallet enforces cryptographic, mathematical, and architectural boundaries to eliminate unauthorized fund draining and UI spoofing:
        </p>

        <div className="space-y-2 pt-1">
          <div className="flex items-start space-x-2 text-[11px]">
            <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-medium">QR &amp; Input Sanitization: </span>
              <span className="text-zinc-500">Instant sanitization and rejection of zero-width spaces (\u200B) and bidirectional Unicode overrides preventing address spoofing.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2 text-[11px]">
            <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-medium">Anti-Poisoning &amp; EIP-55: </span>
              <span className="text-zinc-500">Detection of vanity mimicry addresses (matching prefix/suffix) and EIP-55 cryptographic checksum integrity.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2 text-[11px]">
            <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-medium">Zero/Burn Trap Prevention: </span>
              <span className="text-zinc-500">Strict blockage of zero-address (0x000...) and known burn addresses to prevent accidental fund destruction.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2 text-[11px]">
            <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-medium">Secret Vault &amp; Policy Isolation: </span>
              <span className="text-zinc-500">AI layer holds no raw private keys; operations require TTL-bound Secret Vault grants and deterministic server policy approval.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
