import localforage from 'localforage';

// In-memory fallback map for non-browser/test environments where IndexedDB/WebSQL/localStorage might not be available
const memoryFallback = new Map<string, Map<string, any>>();

export function getMemoryStore(storeName: string): Map<string, any> {
  if (!memoryFallback.has(storeName)) {
    memoryFallback.set(storeName, new Map());
  }
  return memoryFallback.get(storeName)!;
}

// Configure localforage instances
export const appStorage = localforage.createInstance({
  name: 'ScholarSathi',
  storeName: 'appState',
  description: 'Main application state store',
});

export const submissionsStorage = localforage.createInstance({
  name: 'ScholarSathi',
  storeName: 'submissions',
  description: 'Idempotent application submissions store',
});

export const draftsStorage = localforage.createInstance({
  name: 'ScholarSathi',
  storeName: 'applicationDrafts',
  description: 'Step-by-step application drafts store',
});

export async function saveItem<T>(storage: LocalForage, key: string, value: T): Promise<T> {
  const storeName = (storage as any)._config?.storeName || 'default';
  try {
    return await storage.setItem(key, value);
  } catch (err) {
    getMemoryStore(storeName).set(key, value);
    return value;
  }
}

export async function getItem<T>(storage: LocalForage, key: string): Promise<T | null> {
  const storeName = (storage as any)._config?.storeName || 'default';
  try {
    return await storage.getItem<T>(key);
  } catch (err) {
    const val = getMemoryStore(storeName).get(key);
    return val !== undefined ? (val as T) : null;
  }
}

export async function removeItem(storage: LocalForage, key: string): Promise<void> {
  const storeName = (storage as any)._config?.storeName || 'default';
  try {
    await storage.removeItem(key);
  } catch (err) {
    getMemoryStore(storeName).delete(key);
  }
}

export async function clearAllStorage(): Promise<void> {
  try {
    await appStorage.clear();
    await submissionsStorage.clear();
    await draftsStorage.clear();
  } catch (err) {
    memoryFallback.clear();
  }
}
