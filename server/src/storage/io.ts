import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveDataDir(): string {
  if (process.env.STARS_DATA_DIR) {
    return process.env.STARS_DATA_DIR;
  }
  return path.join(__dirname, '..', '..', 'data');
}

export function ensureDataDir(): string {
  const dir = resolveDataDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function readYamlFile<T>(filename: string, fallback: T): T {
  const filePath = path.join(ensureDataDir(), filename);
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) return fallback;
  return YAML.parse(raw) as T;
}

export function writeYamlFile(filename: string, data: unknown): void {
  const filePath = path.join(ensureDataDir(), filename);
  const tmpPath = `${filePath}.tmp`;
  const content = YAML.stringify(data, { lineWidth: 0 });
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export function getDataFilePath(filename: string): string {
  return path.join(ensureDataDir(), filename);
}
