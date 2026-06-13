import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import type { SyncYamlStore } from '@stars-manager/core';

export function createFileYamlStore(dataDir: string): SyncYamlStore & {
  ensureDataDir(): string;
  resolveDataDir(): string;
} {
  function ensureDataDir(): string {
    fs.mkdirSync(dataDir, { recursive: true });
    return dataDir;
  }

  function read<T>(filename: string, fallback: T): T {
    ensureDataDir();
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallback;
    return YAML.parse(raw) as T;
  }

  function write(filename: string, data: unknown): void {
    ensureDataDir();
    const filePath = path.join(dataDir, filename);
    const tmpPath = `${filePath}.tmp`;
    const content = YAML.stringify(data, { lineWidth: 0 });
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  function resolvePath(filename: string): string {
    return path.join(ensureDataDir(), filename);
  }

  return {
    read,
    write,
    resolvePath,
    ensureDataDir,
    resolveDataDir: () => dataDir,
  };
}
