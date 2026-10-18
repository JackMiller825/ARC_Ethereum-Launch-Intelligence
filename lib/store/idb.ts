import { emptyCatalog } from '../analytics/session';
import type { AnalysisSuccess, AppSettings, LibraryCatalog, Playbook, WalletLabel } from '../types';
import { DEFAULT_RPCS } from '../chain/constants';

const DB_NAME = 'arc-launch-intelligence';
const DB_VERSION = 2;

export const defaultSettings: AppSettings = {
  rpcUrls: [],
  blockscoutBase: 'https://eth.blockscout.com',
  demoMode: false,
};

export const defaultPlaybook = (): Playbook => ({
  id: 'default',
  name: 'Next launch',
  regime: 'Unspecified market',
  tokenAddress: '',
  openEnded: false,
  initialEth: 2,
  grossBuyGoal: 20,
  botShare: 40,
  botSellRatio: 70,
  windowMinutes: 60,
  tokenName: '',
  ticker: '',
  plannedAddress: '',
  tokenToLp: '',
  poolType: 'v2',
  expectedStart: '',
  plannedSupply: '',
  qualityThreshold: 90,
  completed: [],
  milestones: [],
  updatedAt: Date.now(),
});

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of ['snapshots', 'playbooks', 'settings', 'labels', 'checkpoints', 'catalog']) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function read<T>(store: string, key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const request = tx.objectStore(store).get(key);
    request.onsuccess = () => resolve((request.result as T) || null);
    request.onerror = () => reject(request.error);
  });
}

async function write(store: string, key: string, value: unknown) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function keys(store: string) {
  const db = await openDb();
  return new Promise<string[]>((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).getAllKeys();
    request.onsuccess = () => resolve(request.result.map(String));
    request.onerror = () => reject(request.error);
  });
}

export async function saveSnapshot(snapshot: AnalysisSuccess) {
  await write('snapshots', snapshot.token.address.toLowerCase(), snapshot);
  await write('checkpoints', snapshot.token.address.toLowerCase(), { blockNumber: snapshot.coverage.toBlock, blockHash: snapshot.coverage.tipHash, chainId: 1 });
}

export async function loadSnapshot(address: string) {
  return read<AnalysisSuccess>('snapshots', address.toLowerCase());
}

export async function listSnapshots() {
  const ids = await keys('snapshots');
  const rows = await Promise.all(ids.map((id) => loadSnapshot(id)));
  return rows.filter((row): row is AnalysisSuccess => Boolean(row)).sort((a, b) => b.savedAt - a.savedAt);
}

export async function loadSettings() {
  return (await read<AppSettings>('settings', 'app')) || defaultSettings;
}

export async function saveSettings(settings: AppSettings) {
  await write('settings', 'app', settings);
}

export async function loadPlaybook() {
  const stored = await read<Partial<Playbook>>('playbooks', 'default');
  return { ...defaultPlaybook(), ...(stored || {}) };
}

export async function savePlaybook(playbook: Playbook) {
  await write('playbooks', 'default', { ...playbook, updatedAt: Date.now() });
}

export async function loadLabels() {
  const ids = await keys('labels');
  const rows = await Promise.all(ids.map((id) => read<WalletLabel>('labels', id)));
  return rows.filter((row): row is WalletLabel => Boolean(row));
}

export async function saveLabel(label: WalletLabel) {
  await write('labels', label.address.toLowerCase(), label);
}

export async function clearWorkspace() {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['snapshots', 'playbooks', 'labels', 'checkpoints', 'catalog'], 'readwrite');
    ['snapshots', 'playbooks', 'labels', 'checkpoints', 'catalog'].forEach((name) => tx.objectStore(name).clear());
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadCatalog() {
  return { ...emptyCatalog(), ...(await read<LibraryCatalog>('catalog', 'library') || {}) };
}

export async function saveCatalog(catalog: LibraryCatalog) {
  await write('catalog', 'library', catalog);
}

export function rpcList(settings: AppSettings) {
  return [...settings.rpcUrls, ...DEFAULT_RPCS];
}
