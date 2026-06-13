type ExtensionChrome = {
  storage: {
    local: {
      get: (keys: string | string[] | Record<string, unknown> | null) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
    };
  };
  permissions: {
    request: (permissions: { origins: string[] }) => Promise<boolean>;
  };
};

export function getExtensionChrome(): ExtensionChrome | null {
  const chrome = (globalThis as { chrome?: ExtensionChrome }).chrome;
  if (!chrome?.storage?.local) return null;
  return chrome;
}
