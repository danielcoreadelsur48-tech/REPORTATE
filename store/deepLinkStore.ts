import { create } from 'zustand';

type DeepLinkScreen = 'reset-password' | 'verify-email';

interface DeepLinkState {
  screen: DeepLinkScreen | null;
  accessToken: string | null;
  refreshToken: string | null;
  errorDescription: string | null;
  rawLog: string[];
  setLink: (link: {
    screen: DeepLinkScreen;
    accessToken: string | null;
    refreshToken: string | null;
    errorDescription: string | null;
  }) => void;
  clear: () => void;
  pushRaw: (line: string) => void;
}

export const useDeepLinkStore = create<DeepLinkState>((set) => ({
  screen: null,
  accessToken: null,
  refreshToken: null,
  errorDescription: null,
  rawLog: [],
  setLink: ({ screen, accessToken, refreshToken, errorDescription }) =>
    set({ screen, accessToken, refreshToken, errorDescription }),
  clear: () => set({ screen: null, accessToken: null, refreshToken: null, errorDescription: null }),
  pushRaw: (line) => set((s) => ({ rawLog: [...s.rawLog, line] })),
}));
