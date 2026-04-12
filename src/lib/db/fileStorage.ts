/**
 * IndexedDB wrapper for student file blobs.
 *
 * Metadata is stored in localStorage (studentFiles.ts).
 * Binary data lives here in IndexedDB, keyed by file ID.
 *
 * TODO (Supabase): Replace saveFileBlob / getFileBlob / deleteFileBlob with:
 *   supabase.storage.from('student-files').upload(path, blob)
 *   supabase.storage.from('student-files').download(path)
 *   supabase.storage.from('student-files').remove([path])
 */

const DB_NAME = 'harmoniq_file_blobs'
const STORE = 'blobs'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não está disponível neste ambiente.'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Persist a file blob keyed by its metadata ID. */
export async function saveFileBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(blob, id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** Retrieve a file blob by ID, or null if not found. */
export async function getFileBlob(id: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve((req.result as Blob) ?? null)
    req.onerror = () => reject(req.error)
  })
}

/** Delete a blob by ID. */
export async function deleteFileBlob(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** Delete multiple blobs by ID (used for cascade deletes). */
export async function deleteFileBlobsByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    ids.forEach((id) => store.delete(id))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
