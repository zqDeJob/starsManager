export interface YamlStore {
  read<T>(filename: string, fallback: T): Promise<T>;
  write(filename: string, data: unknown): Promise<void>;
  resolvePath?(filename: string): string | undefined;
}

export interface SyncYamlStore {
  read<T>(filename: string, fallback: T): T;
  write(filename: string, data: unknown): void;
  resolvePath?(filename: string): string | undefined;
}

export function toAsyncStore(store: SyncYamlStore): YamlStore {
  return {
    read: (filename, fallback) => Promise.resolve(store.read(filename, fallback)),
    write: (filename, data) => Promise.resolve(store.write(filename, data)),
    resolvePath: store.resolvePath?.bind(store),
  };
}
