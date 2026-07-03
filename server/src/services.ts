import path from 'path';
import { fileURLToPath } from 'url';
import {
  toAsyncStore,
  createStarsDataService,
  createGitHubCacheService,
  createLocalSettingsService,
} from '@github-stars-manager/core';
import { createFileYamlStore } from '@github-stars-manager/storage-node';
import { GITHUB_CACHE_FILE, STARS_DATA_FILE, LOCAL_FILE } from '@github-stars-manager/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveDataDir(): string {
  if (process.env.STARS_DATA_DIR) {
    return process.env.STARS_DATA_DIR;
  }
  return path.join(__dirname, '..', 'data');
}

const fileStore = createFileYamlStore(resolveDataDir());
const store = toAsyncStore(fileStore);

export const starsData = createStarsDataService(store);
export const githubCache = createGitHubCacheService(store);
export const localSettings = createLocalSettingsService(store);

export function ensureDataDir(): string {
  return fileStore.ensureDataDir();
}

export function getDataFilePath(filename: string): string {
  return path.join(resolveDataDir(), filename);
}

export { STARS_DATA_FILE, GITHUB_CACHE_FILE, LOCAL_FILE };
