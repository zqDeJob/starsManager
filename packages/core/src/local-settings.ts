import { LOCAL_FILE, type LocalFile } from '@github-stars-manager/shared';
import type { YamlStore } from './yaml-store.js';

export function createLocalSettingsService(store: YamlStore) {
  async function load(): Promise<LocalFile> {
    return store.read<LocalFile>(LOCAL_FILE, {});
  }

  async function save(data: LocalFile): Promise<void> {
    await store.write(LOCAL_FILE, data);
  }

  return {
    async getSetting(key: string): Promise<string | null> {
      const data = await load();
      if (key === 'github_token') return data.githubToken ?? null;
      return null;
    },

    async setSetting(key: string, value: string): Promise<void> {
      const data = await load();
      if (key === 'github_token') {
        data.githubToken = value;
        await save(data);
      }
    },

    async deleteSetting(key: string): Promise<void> {
      const data = await load();
      if (key === 'github_token') {
        delete data.githubToken;
        await save(data);
      }
    },

    getLocalFilePath(): string | undefined {
      return store.resolvePath?.(LOCAL_FILE);
    },
  };
}

export type LocalSettingsService = ReturnType<typeof createLocalSettingsService>;
