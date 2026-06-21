import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredNotification } from '@/types/database';

const STORAGE_KEY = '@notif_list';
const MAX_STORED = 50;

interface NotificationState {
  notifications: StoredNotification[];
  unreadCount: number;
  add: (n: StoredNotification) => void;
  markAllRead: () => void;
  clearAll: () => void;
  _hydrate: () => Promise<void>;
}

async function persist(notifications: StoredNotification[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  add: (n) => {
    if (get().notifications.some((existing) => existing.id === n.id)) return;
    const updated = [n, ...get().notifications].slice(0, MAX_STORED);
    set({ notifications: updated, unreadCount: get().unreadCount + 1 });
    persist(updated);
  },

  markAllRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });
    persist(updated);
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  _hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const notifications: StoredNotification[] = JSON.parse(raw);
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount });
    } catch {}
  },
}));
