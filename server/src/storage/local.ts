import { readYamlFile, writeYamlFile, getDataFilePath } from './io.js';

interface LocalFile {
  githubToken?: string;
}

const FILE = 'local.yaml';

function load(): LocalFile {
  return readYamlFile<LocalFile>(FILE, {});
}

function save(data: LocalFile): void {
  writeYamlFile(FILE, data);
}

export function getSetting(key: string): string | null {
  const data = load();
  if (key === 'github_token') return data.githubToken ?? null;
  return null;
}

export function setSetting(key: string, value: string): void {
  const data = load();
  if (key === 'github_token') {
    data.githubToken = value;
    save(data);
  }
}

export function deleteSetting(key: string): void {
  const data = load();
  if (key === 'github_token') {
    delete data.githubToken;
    save(data);
  }
}

export function getLocalFilePath(): string {
  return getDataFilePath(FILE);
}
