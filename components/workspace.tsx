"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeToken } from '@/lib/chain/analyze';
import { clearWorkspace, defaultPlaybook, defaultSettings, listSnapshots, loadLabels, loadPlaybook, loadSettings, saveLabel, savePlaybook, saveSettings, saveSnapshot } from '@/lib/store/idb';
import type { AnalysisSuccess, AppSettings, Playbook, ProgressUpdate, WalletLabel, WindowSpec } from '@/lib/types';

type WorkspaceValue = {
  ready: boolean;
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => Promise<void>;
  snapshots: AnalysisSuccess[];
  active: AnalysisSuccess | null;
  setActive: (snapshot: AnalysisSuccess | null) => void;
  playbook: Playbook;
  updatePlaybook: (playbook: Playbook) => Promise<void>;
  labels: WalletLabel[];
  updateLabel: (label: WalletLabel) => Promise<void>;
  progress: ProgressUpdate | null;
  error: string;
  analyze: (address: string, window: WindowSpec) => Promise<AnalysisSuccess | null>;
  cancel: () => void;
  reset: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [snapshots, setSnapshots] = useState<AnalysisSuccess[]>([]);
  const [active, setActive] = useState<AnalysisSuccess | null>(null);
  const [playbook, setPlaybook] = useState<Playbook>(defaultPlaybook());
  const [labels, setLabels] = useState<WalletLabel[]>([]);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSettings(), listSnapshots(), loadPlaybook(), loadLabels()]).then(([nextSettings, nextSnapshots, nextPlaybook, nextLabels]) => {
      if (cancelled) return;
      setSettings(nextSettings);
      setSnapshots(nextSnapshots);
      setActive(nextSnapshots[0] || null);
      setPlaybook(nextPlaybook);
      setLabels(nextLabels);
      setReady(true);
    }).catch(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<WorkspaceValue>(() => ({
    ready, settings, snapshots, active, setActive, playbook, labels, progress, error,
    updateSettings: async (next) => { setSettings(next); await saveSettings(next); },
    updatePlaybook: async (next) => { setPlaybook(next); await savePlaybook(next); },
    updateLabel: async (label) => {
      await saveLabel(label);
      setLabels((current) => [...current.filter((item) => item.address.toLowerCase() !== label.address.toLowerCase()), label]);
    },
    cancel: () => abortRef.current?.abort(),
    reset: async () => {
      await clearWorkspace();
      setSnapshots([]);
      setActive(null);
      setPlaybook(defaultPlaybook());
      setLabels([]);
    },
    analyze: async (address, window) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setError('');
      setProgress({ stage: 'Start', detail: 'Validating the contract', pct: 2 });
      const prior: Record<string, string[]> = {};
      for (const snap of snapshots) {
        if (snap.token.address.toLowerCase() === address.toLowerCase()) continue;
        for (const trade of snap.trades) {
          const key = trade.wallet.toLowerCase();
          prior[key] = [...new Set([...(prior[key] || []), snap.token.symbol])];
        }
      }
      const result = await analyzeToken({
        address,
        window,
        rpcUrls: settings.rpcUrls,
        blockscoutBase: settings.blockscoutBase,
        projectWallets: labels.filter((item) => item.role === 'project').map((item) => item.address),
        independentWallets: labels.filter((item) => item.role === 'independent').map((item) => item.address),
        priorLaunches: prior,
        signal: controller.signal,
        onProgress: setProgress,
      });
      if (controller.signal.aborted) return null;
      setProgress(null);
      if (!result.ok) {
        setError(result.reason);
        return null;
      }
      setActive(result);
      await saveSnapshot(result);
      setSnapshots(await listSnapshots());
      return result;
    },
  }), [ready, settings, snapshots, active, playbook, labels, progress, error]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('Workspace is unavailable.');
  return value;
}
