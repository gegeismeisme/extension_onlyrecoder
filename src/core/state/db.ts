import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface OnlyRecoderDB extends DBSchema {
  kv: {
    key: string;
    value: string;
  };
}

let dbPromise: Promise<IDBPDatabase<OnlyRecoderDB>> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OnlyRecoderDB>('onlyrecoder-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      }
    });
  }
  return dbPromise;
}

export const indexedDbStorage = {
  async getItem(name: string) {
    const db = await getDb();
    return (await db.get('kv', name)) ?? null;
  },
  async setItem(name: string, value: string) {
    const db = await getDb();
    await db.put('kv', value, name);
  },
  async removeItem(name: string) {
    const db = await getDb();
    await db.delete('kv', name);
  }
};
