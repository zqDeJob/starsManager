import YAML from 'yaml';
import type { YamlStore } from '@github-stars-manager/core';

const KEY_PREFIX = 'yaml:';

export function createChromeYamlStore(): YamlStore {
  return {
    async read<T>(filename: string, fallback: T): Promise<T> {
      const key = KEY_PREFIX + filename;
      const result = await chrome.storage.local.get(key);
      const raw = result[key] as string | undefined;
      if (!raw?.trim()) return fallback;
      return YAML.parse(raw) as T;
    },

    async write(filename: string, data: unknown): Promise<void> {
      const key = KEY_PREFIX + filename;
      await chrome.storage.local.set({ [key]: YAML.stringify(data, { lineWidth: 0 }) });
    },
  };
}

export async function exportYamlFile(filename: string): Promise<string | null> {
  const key = KEY_PREFIX + filename;
  const result = await chrome.storage.local.get(key);
  return (result[key] as string | undefined) ?? null;
}

export async function importYamlFile(filename: string, content: string): Promise<void> {
  YAML.parse(content);
  await chrome.storage.local.set({ [KEY_PREFIX + filename]: content });
}
