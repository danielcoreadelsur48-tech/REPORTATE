import { create } from 'zustand';

type DeepLinkScreen = 'verify-email';

interface DeepLinkState {
  screen: DeepLinkScreen | null;
  accessToken: string | null;
  refreshToken: string | null;
  errorDescription: string | null;
  setLink: (link: {
    screen: DeepLinkScreen;
    accessToken: string | null;
    refreshToken: string | null;
    errorDescription: string | null;
  }) => void;
  clear: () => void;
}

export const useDeepLinkStore = create<DeepLinkState>((set) => ({
  screen: null,
  accessToken: null,
  refreshToken: null,
  errorDescription: null,
  setLink: ({ screen, accessToken, refreshToken, errorDescription }) =>
    set({ screen, accessToken, refreshToken, errorDescription }),
  clear: () => set({ screen: null, accessToken: null, refreshToken: null, errorDescription: null }),
}));
