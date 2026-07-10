import { db } from '../db/db';
import { apiRequest } from './api';

let isSyncing = false;

export const syncService = {
  isOnline() {
    return navigator.onLine;
  },

  async getPendingCount() {
    return await db.outbox.count();
  },

  getLastSynced() {
    return localStorage.getItem('last_sync_timestamp') || 'Never';
  },

  async syncPush() {
    const pendingMutations = await db.outbox.orderBy('id').toArray();
    if (pendingMutations.length === 0) return true;

    console.log(`Pushing ${pendingMutations.length} mutations to server...`);
    const payload = {
      mutations: pendingMutations.map(mut => ({
        table: mut.table,
        action: mut.action,
        record_id: mut.record_id,
        data: JSON.parse(mut.data)
      }))
    };

    try {
      const response = await apiRequest('/api/sync/push/', 'POST', payload);
      if (response && response.status === 'success') {
        const results = response.results;
        // Reconcile and clear successfully applied outbox mutations
        for (let i = 0; i < results.length; i++) {
          const res = results[i];
          if (res.status === 'applied' || res.status === 'skipped') {
            const mut = pendingMutations[i];
            await db.outbox.delete(mut.id);
          } else {
            console.error(`Mutation failed for record ${res.record_id}: ${res.message}`);
            // Discard failed outbox mutation to prevent queue blockage
            const mut = pendingMutations[i];
            await db.outbox.delete(mut.id);

            // Log to local sync_errors list
            try {
              const errors = JSON.parse(localStorage.getItem('sync_errors') || '[]');
              errors.push({
                timestamp: new Date().toISOString(),
                table: mut.table,
                action: mut.action,
                record_id: mut.record_id,
                error: res.message,
                data: JSON.parse(mut.data)
              });
              if (errors.length > 20) {
                errors.shift();
              }
              localStorage.setItem('sync_errors', JSON.stringify(errors));
            } catch (err) {
              console.error('Failed to write to sync_errors log', err);
            }
          }
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to push sync mutations', error);
      return false;
    }
    return false;
  },

  async syncPull() {
    const lastSync = localStorage.getItem('last_sync_timestamp');
    const endpoint = lastSync ? `/api/sync/pull/?last_sync=${encodeURIComponent(lastSync)}` : '/api/sync/pull/';

    try {
      const response = await apiRequest(endpoint, 'GET');
      if (response && response.server_timestamp) {
        const { server_timestamp, changes } = response;

        // Apply server changes transactionally
        await db.transaction('rw', Object.keys(changes), async () => {
          for (const [table, records] of Object.entries(changes)) {
            for (const record of records) {
              const localRecord = { ...record, is_deleted: record.is_deleted ? 1 : 0 };
              if (localRecord.is_deleted === 1) {
                // If soft-deleted on server, remove from IndexedDB
                await db[table].delete(localRecord.id);
              } else {
                // Otherwise upsert locally
                await db[table].put(localRecord);
              }
            }
          }
        });

        localStorage.setItem('last_sync_timestamp', server_timestamp);
        return true;
      }
    } catch (error) {
      console.error('Failed to pull sync updates', error);
      return false;
    }
    return false;
  },

  async syncAll() {
    if (!this.isOnline()) {
      console.log('App is offline. Sync skipped.');
      return;
    }
    if (isSyncing) return;

    isSyncing = true;
    window.dispatchEvent(new CustomEvent('sync-status-changed', { detail: { syncing: true } }));

    try {
      const pushSuccess = await this.syncPush();
      if (pushSuccess) {
        await this.syncPull();
      }
    } catch (error) {
      console.error('Synchronization process encountered error', error);
    } finally {
      isSyncing = false;
      window.dispatchEvent(new CustomEvent('sync-status-changed', { detail: { syncing: false } }));
    }
  },

  initialize() {
    // Sync immediately on boot and when connection is restored
    this.syncAll();

    window.addEventListener('online', () => {
      console.log('Network connected. Running sync...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      window.dispatchEvent(new CustomEvent('sync-status-changed', { detail: { syncing: false } }));
    });

    window.addEventListener('local-db-changed', () => {
      // Defer sync call slightly to batch quick successive writes
      setTimeout(() => this.syncAll(), 1000);
    });

    // Check periodically every 60 seconds
    setInterval(() => {
      this.syncAll();
    }, 60000);
  }
};
