import { readYamlFile, writeYamlFile, getDataFilePath } from './io.js';
import { emptyStarsData, type DiyCategory, type DiyRepoEntry, type StarsDataFile } from './types.js';

const FILE = 'stars-data.yaml';

function load(): StarsDataFile {
  return readYamlFile(FILE, emptyStarsData());
}

function save(data: StarsDataFile): void {
  data.updatedAt = new Date().toISOString();
  writeYamlFile(FILE, data);
}

export function listCategories(): (DiyCategory & { repoCount: number })[] {
  const data = load();
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
}

export function createCategory(name: string, color: string, id: string, createdAt: string): DiyCategory {
  const data = load();
  const category: DiyCategory = { id, name, color, createdAt };
  data.categories.push(category);
  save(data);
  return category;
}

export function updateCategory(id: string, patch: { name?: string; color?: string }): DiyCategory | null {
  const data = load();
  const cat = data.categories.find(c => c.id === id);
  if (!cat) return null;
  if (patch.name !== undefined) cat.name = patch.name;
  if (patch.color !== undefined) cat.color = patch.color;
  save(data);
  return cat;
}

export function deleteCategory(id: string): void {
  const data = load();
  data.categories = data.categories.filter(c => c.id !== id);
  for (const entry of Object.values(data.repos)) {
    entry.categoryIds = entry.categoryIds.filter(cid => cid !== id);
  }
  save(data);
}

export function findRepoByNodeId(nodeId: string): { fullName: string; entry: DiyRepoEntry } | null {
  const data = load();
  for (const [fullName, entry] of Object.entries(data.repos)) {
    if (entry.nodeId === nodeId) return { fullName, entry };
  }
  return null;
}

export function updateRepoMeta(
  fullName: string,
  nodeId: string,
  patch: { customDescription?: string; tags?: string[] },
): DiyRepoEntry {
  const data = load();
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
  save(data);
  return entry;
}

export function addRepoToCategory(fullName: string, nodeId: string, categoryId: string): void {
  const data = load();
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
  save(data);
}

export function removeRepoFromCategoryByNodeId(nodeId: string, categoryId: string): void {
  const data = load();
  for (const entry of Object.values(data.repos)) {
    if (entry.nodeId === nodeId) {
      entry.categoryIds = entry.categoryIds.filter(id => id !== categoryId);
      entry.updatedAt = new Date().toISOString();
      save(data);
      return;
    }
  }
}

export function getCategoryMap(): Map<string, DiyCategory> {
  const data = load();
  return new Map(data.categories.map(c => [c.id, c]));
}

export function getAllTags(): string[] {
  const data = load();
  const tags = new Set<string>();
  for (const entry of Object.values(data.repos)) {
    for (const tag of entry.tags) tags.add(tag);
  }
  return [...tags].sort();
}

export function getStarsDataFilePath(): string {
  return getDataFilePath(FILE);
}

export function getAllRepoEntries(): Record<string, DiyRepoEntry> {
  return load().repos;
}
