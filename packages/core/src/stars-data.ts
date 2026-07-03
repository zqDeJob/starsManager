import YAML from 'yaml';
import {
  STARS_DATA_FILE,
  emptyStarsData,
  type DiyCategory,
  type DiyRepoEntry,
  type StarsDataFile,
} from '@github-stars-manager/shared';
import type { YamlStore } from './yaml-store.js';

export function createStarsDataService(store: YamlStore) {
  async function load(): Promise<StarsDataFile> {
    return store.read(STARS_DATA_FILE, emptyStarsData());
  }

  async function save(data: StarsDataFile): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await store.write(STARS_DATA_FILE, data);
  }

  return {
    async listCategories(): Promise<(DiyCategory & { repoCount: number })[]> {
      const data = await load();
      const counts = new Map<string, number>();

      for (const entry of Object.values(data.repos)) {
        for (const catId of entry.categoryIds) {
          counts.set(catId, (counts.get(catId) ?? 0) + 1);
        }
      }

      return data.categories
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(cat => ({
          ...cat,
          repoCount: counts.get(cat.id) ?? 0,
        }));
    },

    async createCategory(name: string, color: string, id: string, createdAt: string): Promise<DiyCategory> {
      const data = await load();
      const category: DiyCategory = { id, name, color, createdAt };
      data.categories.push(category);
      await save(data);
      return category;
    },

    async updateCategory(id: string, patch: { name?: string; color?: string }): Promise<DiyCategory | null> {
      const data = await load();
      const cat = data.categories.find(c => c.id === id);
      if (!cat) return null;
      if (patch.name !== undefined) cat.name = patch.name;
      if (patch.color !== undefined) cat.color = patch.color;
      await save(data);
      return cat;
    },

    async deleteCategory(id: string): Promise<void> {
      const data = await load();
      data.categories = data.categories.filter(c => c.id !== id);
      for (const entry of Object.values(data.repos)) {
        entry.categoryIds = entry.categoryIds.filter(cid => cid !== id);
      }
      await save(data);
    },

    async findRepoByNodeId(nodeId: string): Promise<{ fullName: string; entry: DiyRepoEntry } | null> {
      const data = await load();
      for (const [fullName, entry] of Object.entries(data.repos)) {
        if (entry.nodeId === nodeId) return { fullName, entry };
      }
      return null;
    },

    async updateRepoMeta(
      fullName: string,
      nodeId: string,
      patch: { customDescription?: string; tags?: string[] },
    ): Promise<DiyRepoEntry> {
      const data = await load();
      const entry = data.repos[fullName] ?? {
        nodeId,
        customDescription: '',
        tags: [],
        categoryIds: [],
        updatedAt: new Date().toISOString(),
      };
      entry.nodeId = nodeId;
      if (patch.customDescription !== undefined) entry.customDescription = patch.customDescription;
      if (patch.tags !== undefined) entry.tags = patch.tags;
      entry.updatedAt = new Date().toISOString();
      data.repos[fullName] = entry;
      await save(data);
      return entry;
    },

    async addRepoToCategory(fullName: string, nodeId: string, categoryId: string): Promise<void> {
      const data = await load();
      const cat = data.categories.find(c => c.id === categoryId);
      if (!cat) throw new Error('分类不存在');

      const entry = data.repos[fullName] ?? {
        nodeId,
        customDescription: '',
        tags: [],
        categoryIds: [],
        updatedAt: new Date().toISOString(),
      };
      entry.nodeId = nodeId;
      if (!entry.categoryIds.includes(categoryId)) {
        entry.categoryIds.push(categoryId);
      }
      entry.updatedAt = new Date().toISOString();
      data.repos[fullName] = entry;
      await save(data);
    },

    async removeRepoFromCategoryByNodeId(nodeId: string, categoryId: string): Promise<void> {
      const data = await load();
      for (const entry of Object.values(data.repos)) {
        if (entry.nodeId === nodeId) {
          entry.categoryIds = entry.categoryIds.filter(id => id !== categoryId);
          entry.updatedAt = new Date().toISOString();
          await save(data);
          return;
        }
      }
    },

    async getCategoryMap(): Promise<Map<string, DiyCategory>> {
      const data = await load();
      return new Map(data.categories.map(c => [c.id, c]));
    },

    async getAllTags(): Promise<string[]> {
      const data = await load();
      const tags = new Set<string>();
      for (const entry of Object.values(data.repos)) {
        for (const tag of entry.tags) tags.add(tag);
      }
      return [...tags].sort();
    },

    getStarsDataFilePath(): string | undefined {
      return store.resolvePath?.(STARS_DATA_FILE);
    },

    async getAllRepoEntries(): Promise<Record<string, DiyRepoEntry>> {
      return (await load()).repos;
    },

    async exportYaml(): Promise<string> {
      const data = await load();
      return YAML.stringify(data, { lineWidth: 0 });
    },

    async importYaml(content: string): Promise<void> {
      const parsed = YAML.parse(content) as StarsDataFile;
      if (!parsed || parsed.version !== 1) throw new Error('无效的 stars-data.yaml');
      await save(parsed);
    },
  };
}

export type StarsDataService = ReturnType<typeof createStarsDataService>;
