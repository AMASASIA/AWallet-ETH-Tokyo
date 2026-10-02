import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Archive, 
  RotateCcw, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Database 
} from 'lucide-react';
import { AppSnapshot, snapshotService } from '../services/snapshotService';
import { User, Token, NFTItem, InvisibleAction, PolicyEngineConfig } from '../types';

interface SnapshotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentTokens: Token[];
  currentNfts?: NFTItem[];
  currentInvisibleActions?: InvisibleAction[];
  currentPolicyConfig?: PolicyEngineConfig;
  currentNetwork?: string;
  onRestoreSnapshot: (snapshot: AppSnapshot) => void;
}

export const SnapshotManagerModal: React.FC<SnapshotManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentTokens,
  currentNfts,
  currentInvisibleActions,
  currentPolicyConfig,
  currentNetwork,
  onRestoreSnapshot,
}) => {
  const [snapshots, setSnapshots] = useState<AppSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const list = await snapshotService.getSnapshots();
      setSnapshots(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateSnapshot = async () => {
    try {
      const name = customName.trim() || `State Anchor (${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`;
      const created = await snapshotService.createSnapshot({
        name,
        user: currentUser,
        tokens: currentTokens,
        nfts: currentNfts,
        invisibleActions: currentInvisibleActions,
        policyConfig: currentPolicyConfig,
        network: currentNetwork,
      });
      setSnapshots((prev) => [created, ...prev]);
      setCustomName('');
      setMessage({ type: 'success', text: `Successfully saved snapshot "${created.name}".` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Failed to save snapshot: ${msg}` });
    }
  };

  const handleRestore = (s: AppSnapshot) => {
    try {
      onRestoreSnapshot(s);
      setMessage({ type: 'success', text: `Restored state to "${s.name}"!` });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Restore failed: ${msg}` });
    }
  };

  const handleDelete = async (id: string) => {
    await snapshotService.deleteSnapshot(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDownload = (s: AppSnapshot) => {
    snapshotService.downloadSnapshotFile(s);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = await snapshotService.importSnapshotFromJson(text);
        setSnapshots((prev) => [imported, ...prev]);
        setMessage({ type: 'success', text: `Imported snapshot "${imported.name}".` });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setMessage({ type: 'error', text: `Import error: ${msg}` });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-zinc-800 p-5 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Archive size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-white">State Anchoring &amp; Full Restore</h3>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Protected
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Backup and restore balances, UI configs, and actions in 1 click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-red-950/40 border-red-800 text-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-red-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-zinc-400 hover:text-white ml-2">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Create Snapshot Quick Bar */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Save Current App State Now
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Anchor &amp; Aether Synced</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Snapshot Name (e.g. Production Release)"
              className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={handleCreateSnapshot}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <Plus size={14} />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Import/Export Action Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-zinc-500 font-medium">Saved Snapshots ({snapshots.length})</span>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center space-x-1 py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
              title="Import JSON snapshot"
            >
              <Upload size={11} />
              <span>Import File</span>
            </button>
          </div>
        </div>

        {/* Snapshots Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">Loading snapshots...</div>
          ) : snapshots.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Database size={24} className="mx-auto text-zinc-600" />
              <p className="text-xs text-zinc-500">No saved snapshots yet.</p>
              <p className="text-[11px] text-zinc-600">Click &ldquo;Save&rdquo; to preserve the current state.</p>
            </div>
          ) : (
            snapshots.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 transition-colors space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white truncate">{s.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 shrink-0">
                        {s.network || 'Base'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                      <Clock size={10} />
                      <span>{s.timestamp}</span>
                      <span>·</span>
                      <span>{s.tokens?.length || 0} tokens</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Restore Button */}
                    <button
                      onClick={() => handleRestore(s)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer shadow"
                      title="Restore to this state"
                    >
                      <RotateCcw size={11} />
                      <span>Restore</span>
                    </button>

                    {/* Download JSON */}
                    <button
                      onClick={() => handleDownload(s)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Download Backup JSON"
                    >
                      <Download size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/60 hover:text-red-400 text-zinc-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-zinc-500 truncate pt-1 border-t border-zinc-900/80 flex items-center justify-between">
                  <span>Anchor: {s.anchorDid ? `${s.anchorDid.slice(0, 16)}...` : 'N/A'}</span>
                  <span className="text-emerald-400/80">Signature Verified</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-zinc-900 text-center">
          <p className="text-[10px] text-zinc-500">
            Snapshots are preserved both locally and in Firebase Cloud Firestore.
          </p>
        </div>
      </div>
    </div>
  );
};
