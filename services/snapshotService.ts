import { doc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Token, NFTItem, InvisibleAction, PolicyEngineConfig, User } from '../types';

export interface AppSnapshot {
  id: string;
  name: string;
  timestamp: string;
  epoch: number;
  anchorDid: string;
  aetherDid?: string;
  user: User;
  tokens: Token[];
  nfts?: NFTItem[];
  invisibleActions?: InvisibleAction[];
  policyConfig?: PolicyEngineConfig;
  network: string;
  note?: string;
}

const LOCAL_STORAGE_SNAPSHOT_KEY = 'awallet_state_snapshots_v1';
const LOCAL_STORAGE_ACTIVE_RESTORE_KEY = 'awallet_last_restored_id';

export const snapshotService = {
  // Get all saved snapshots (Local + Firebase if signed in)
  async getSnapshots(): Promise<AppSnapshot[]> {
    const localList: AppSnapshot[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localList.push(...parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse local snapshots:', e);
    }

    // Attempt Firebase sync if user logged in
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const colRef = collection(db, 'users', currentUser.uid, 'snapshots');
        const q = query(colRef, orderBy('epoch', 'desc'), limit(10));
        const snap = await getDocs(q);
        const remoteList: AppSnapshot[] = [];
        snap.forEach((d) => {
          remoteList.push(d.data() as AppSnapshot);
        });
        
        // Merge without duplicates by ID
        const map = new Map<string, AppSnapshot>();
        for (const s of [...remoteList, ...localList]) {
          map.set(s.id, s);
        }
        return Array.from(map.values()).sort((a, b) => b.epoch - a.epoch);
      } catch (err) {
        console.warn('Firestore snapshots fetch skipped:', err);
      }
    }

    return localList.sort((a, b) => b.epoch - a.epoch);
  },

  // Save current state as an immutable anchored snapshot
  async createSnapshot(data: {
    name: string;
    user: User;
    tokens: Token[];
    nfts?: NFTItem[];
    invisibleActions?: InvisibleAction[];
    policyConfig?: PolicyEngineConfig;
    network?: string;
    note?: string;
  }): Promise<AppSnapshot> {
    const id = `snap-${Date.now()}`;
    const epoch = Date.now();
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const snapshot: AppSnapshot = {
      id,
      name: data.name || `Complete State Anchor (${timestamp})`,
      timestamp,
      epoch,
      anchorDid: data.user.anchorDid || data.user.did,
      aetherDid: data.user.aetherDid,
      user: data.user,
      tokens: data.tokens,
      nfts: data.nfts,
      invisibleActions: data.invisibleActions,
      policyConfig: data.policyConfig,
      network: data.network || data.user.network || 'Base Mainnet',
      note: data.note || 'Full state and UI snapshot',
    };

    // 1. Save to LocalStorage immediately
    try {
      const existing = await this.getSnapshots();
      const updated = [snapshot, ...existing.filter((s) => s.id !== id)].slice(0, 15);
      localStorage.setItem(LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to store snapshot locally:', e);
    }

    // 2. Sync to Firebase Cloud Firestore if signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'snapshots', id);
        await setDoc(docRef, snapshot, { merge: true });
      } catch (err) {
        console.warn('Failed to sync snapshot to Firestore:', err);
      }
    }

    return snapshot;
  },

  // Export current snapshot as a downloadable JSON file
  downloadSnapshotFile(snapshot: AppSnapshot) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `awallet_anchor_backup_${snapshot.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Import snapshot from uploaded JSON string
  async importSnapshotFromJson(jsonString: string): Promise<AppSnapshot> {
    const parsed = JSON.parse(jsonString);
    if (!parsed.user || !parsed.tokens) {
      throw new Error('Invalid snapshot backup file format');
    }
    const newId = `imported-${Date.now()}`;
    const importedSnapshot: AppSnapshot = {
      ...parsed,
      id: newId,
      name: `Imported: ${parsed.name || 'External Backup'}`,
      epoch: Date.now(),
    };

    const existing = await this.getSnapshots();
    const updated = [importedSnapshot, ...existing].slice(0, 15);
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(updated));
    return importedSnapshot;
  },

  // Delete a snapshot
  async deleteSnapshot(id: string): Promise<void> {
    const existing = await this.getSnapshots();
    const filtered = existing.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(filtered));
  },
};
