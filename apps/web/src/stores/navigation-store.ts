import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface RecentItem {
  id: string;
  title: string;
  href: string;
  type: 'company' | 'contact' | 'deal' | 'lead' | 'task' | 'page';
  timestamp: number;
}

export interface FavoriteItem {
  id: string;
  title: string;
  href: string;
  type: 'company' | 'contact' | 'deal' | 'lead' | 'view';
}

interface NavigationState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  mobileDrawerOpen: boolean;
  notificationOpen: boolean;
  quickCreateOpen: boolean;
  quickCreateDefaultType: string | null;
  favorites: FavoriteItem[];
  recents: RecentItem[];

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setNotificationOpen: (open: boolean) => void;
  setQuickCreateOpen: (open: boolean, defaultType?: string | null) => void;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  addRecent: (item: Omit<RecentItem, 'timestamp'>) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      sidebarWidth: 240,
      mobileDrawerOpen: false,
      notificationOpen: false,
      quickCreateOpen: false,
      quickCreateDefaultType: null,
      favorites: [
        { id: 'fav-deals', title: 'Sales Pipeline', href: '/deals', type: 'view' },
        { id: 'fav-companies', title: 'Company Accounts', href: '/companies', type: 'view' },
      ],
      recents: [],

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
      setNotificationOpen: (notificationOpen) => set({ notificationOpen }),
      setQuickCreateOpen: (quickCreateOpen, defaultType = null) =>
        set({ quickCreateOpen, quickCreateDefaultType: defaultType }),

      addFavorite: (item) => {
        const { favorites } = get();
        if (favorites.some((f) => f.id === item.id)) return;
        set({ favorites: [item, ...favorites] });
      },

      removeFavorite: (id) => {
        set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) }));
      },

      addRecent: (item) => {
        const { recents } = get();
        const filtered = recents.filter((r) => r.href !== item.href);
        const newItem: RecentItem = { ...item, timestamp: Date.now() };
        set({ recents: [newItem, ...filtered].slice(0, 10) });
      },
    }),
    {
      name: 'forge-crm-navigation-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        favorites: state.favorites,
        recents: state.recents,
      }),
    }
  )
);
