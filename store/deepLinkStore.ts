import { create } from 'zustand';

type DeepLinkScreen = 'reset-password' | 'verify-email';

interface DeepLinkState {
  screen: DeepLinkScreen | null;
  code: string | null;
  errorDescription: string | null;
  rawLog: string[];
  setLink: (link: { screen: DeepLinkScreen; code: string | null; errorDescription: string | null }) => void;
  clear: () => void;
  pushRaw: (line: string) => void;
}

export const useDeepLinkStore = create<DeepLinkState>((set) => ({
  screen: null,
  code: null,
  errorDescription: null,
  rawLog: [],
  setLink: ({ screen, code, errorDescription }) => set({ screen, code, errorDescription }),
  clear: () => set({ screen: null, code: null, errorDescription: null }),
  pushRaw: (line) => set((s) => ({ rawLog: [...s.rawLog, line] })),
}));
