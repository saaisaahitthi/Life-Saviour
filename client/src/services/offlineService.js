import { openDB } from 'idb';

const DB_NAME = 'LifeSaviourOffline';
const STORE_NAME = 'emergencyQueue';

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const offlineService = {
  /**
   * Queue an emergency request for later sync
   */
  async queueEmergency(data) {
    const db = await initDB();
    const entry = {
      ...data,
      queuedAt: new Date().toISOString(),
      status: 'pending_sync'
    };
    return db.add(STORE_NAME, entry);
  },

  /**
   * Get all queued emergencies
   */
  async getQueuedEmergencies() {
    const db = await initDB();
    return db.getAll(STORE_NAME);
  },

  /**
   * Clear synced items
   */
  async clearSynced(id) {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
  },

  /**
   * Check if online
   */
  isOnline() {
    return navigator.onLine;
  }
};
