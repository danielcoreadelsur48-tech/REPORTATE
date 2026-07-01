import { create } from 'zustand';

type DeepLinkScreen = 'reset-password' | 'verify-email';

interface DeepLinkState {
  screen: DeepLinkScreen | null;
  code: string | null;
  errorDescription: string | null;
  setLink: (link: { screen: DeepLinkScreen; code: string | null; errorDescription: string | null }) => void;
  clear: () => void;
}

export const useDeepLinkStore = create<DeepLinkState>((set) => ({
  screen: null,
  code: null,
  errorDescription: null,
  setLink: ({ screen, code, errorDescription }) => set({ screen, code, errorDescription }),
  clear: () => set({ screen: null, code: null, errorDescription: null }),
}));
