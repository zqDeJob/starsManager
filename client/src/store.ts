import { create } from 'zustand';
import { api } from './api';
import type { DiyCategory, Repo, RepoWithMeta, StarList, SyncStatus, Tab } from './types';
import { UNCATEGORIZED_ID } from './types';

interface AppState {
  tab: Tab;
  setTab: (tab: Tab) => void;

  syncStatus: SyncStatus | null;
  user: { login: string; avatar_url: string } | null;
  syncing: boolean;
  error: string | null;

  stars: Repo[];
  starLists: StarList[];
  categories: DiyCategory[];
  diyRepos: RepoWithMeta[];
  selectedCategoryId: string | null;
  searchQuery: string;

  loadSyncStatus: () => Promise<void>;
  saveToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  sync: () => Promise<void>;
  loadStars: () => Promise<void>;
  loadStarLists: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadDiyRepos: () => Promise<void>;
  setSelectedCategoryId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  createCategory: (name: string, color?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addRepoToCategory: (categoryId: string, repoNodeId: string) => Promise<void>;
  removeRepoFromCategory: (categoryId: string, repoNodeId: string) => Promise<void>;
  updateRepoMeta: (repoNodeId: string, data: { custom_description?: string; tags?: string[] }) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  tab: 'github-stars',
  setTab: tab => set({ tab }),

  syncStatus: null,
  user: null,
  syncing: false,
  error: null,

  stars: [],
  starLists: [],
  categories: [],
  diyRepos: [],
  selectedCategoryId: null,
  searchQuery: '',

  loadSyncStatus: async () => {
    try {
      const syncStatus = await api.getSyncStatus();
      set({ syncStatus, error: null });
      if (syncStatus.hasToken) {
        try {
          const user = await api.getUser();
          set({ user });
        } catch {
          set({ user: null });
        }
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  saveToken: async token => {
    await api.saveToken(token);
    await get().loadSyncStatus();
  },

  clearToken: async () => {
    await api.clearToken();
    set({ user: null });
    await get().loadSyncStatus();
  },

  sync: async () => {
    set({ syncing: true, error: null });
    try {
      await api.sync();
      await Promise.all([
        get().loadSyncStatus(),
        get().loadStars(),
        get().loadStarLists(),
        get().loadDiyRepos(),
      ]);
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ syncing: false });
    }
  },

  loadStars: async () => {
    const { searchQuery } = get();
    const stars = await api.getStars(searchQuery || undefined);
    set({ stars });
  },

  loadStarLists: async () => {
    const starLists = await api.getStarLists();
    set({ starLists });
  },

  loadCategories: async () => {
    const categories = await api.getCategories();
    set({ categories });
  },

  loadDiyRepos: async () => {
    const { searchQuery, selectedCategoryId } = get();
    const uncategorized = selectedCategoryId === UNCATEGORIZED_ID;
    const diyRepos = await api.getReposWithMeta(
      searchQuery || undefined,
      uncategorized ? undefined : selectedCategoryId ?? undefined,
      uncategorized,
    );
    set({ diyRepos });
  },

  setSelectedCategoryId: id => {
    set({ selectedCategoryId: id });
    get().loadDiyRepos();
  },

  setSearchQuery: q => {
    set({ searchQuery: q });
  },

  createCategory: async (name, color) => {
    await api.createCategory(name, color);
    await get().loadCategories();
  },

  deleteCategory: async id => {
    await api.deleteCategory(id);
    const { selectedCategoryId } = get();
    if (selectedCategoryId === id) set({ selectedCategoryId: null });
    await Promise.all([get().loadCategories(), get().loadDiyRepos()]);
  },

  addRepoToCategory: async (categoryId, repoNodeId) => {
    await api.addRepoToCategory(categoryId, repoNodeId);
    await Promise.all([get().loadCategories(), get().loadDiyRepos()]);
  },

  removeRepoFromCategory: async (categoryId, repoNodeId) => {
    await api.removeRepoFromCategory(categoryId, repoNodeId);
    await Promise.all([get().loadCategories(), get().loadDiyRepos()]);
  },

  updateRepoMeta: async (repoNodeId, data) => {
    await api.updateRepoMeta(repoNodeId, data);
    await get().loadDiyRepos();
  },
}));
