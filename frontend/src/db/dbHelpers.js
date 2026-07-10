import { db } from './db';

// Helper to generate UUID v4 in plain JS
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Save record locally (Insert or Update) and queue mutation in outbox
 */
export async function saveLocal(table, data) {
  const now = new Date().toISOString();
  const isNew = !data.id;
  const recordId = data.id || generateUUID();

  const record = {
    ...data,
    id: recordId,
    updated_at: now,
    is_deleted: data.is_deleted ? 1 : 0
  };

  if (isNew) {
    record.created_at = now;
  }

  // 1. Write to local Dexie table
  await db[table].put(record);

  // 2. Queue mutation in Outbox
  await db.outbox.add({
    table: table,
    action: isNew ? 'CREATE' : 'UPDATE',
    record_id: recordId,
    data: JSON.stringify(record),
    timestamp: now
  });

  // Trigger sync in background (if online)
  // We will import syncManager dynamically or rely on window event
  window.dispatchEvent(new Event('local-db-changed'));

  return record;
}

/**
 * Soft delete record locally and queue delete mutation in outbox
 */
export async function deleteLocal(table, recordId) {
  const now = new Date().toISOString();
  const record = await db[table].get(recordId);

  if (record) {
    record.is_deleted = 1;
    record.updated_at = now;

    // 1. Soft delete locally
    await db[table].put(record);

    // 2. Queue deletion in Outbox
    await db.outbox.add({
      table: table,
      action: 'DELETE',
      record_id: recordId,
      data: JSON.stringify(record),
      timestamp: now
    });

    window.dispatchEvent(new Event('local-db-changed'));
  }
}
