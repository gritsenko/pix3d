const DB_NAME = 'Pix3DProjectDB';
const STORE_NAME = 'projectHandles';

let db: IDBDatabase | null = null;

/**
 * Opens and returns the IndexedDB database instance.
 * Initializes the object store if it doesn't exist.
 */
async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    // Open IndexedDB with version 1
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      // This event fires if the database is created or a new version is requested
      const database = (event.target as IDBOpenDBRequest).result;
      // Create an object store to hold our directory handles
      // 'id' will be the key to retrieve handles later
      database.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBRequest).error);
      reject('Error opening IndexedDB: ' + (event.target as IDBRequest).error);
    };
  });
}

/**
 * Saves a FileSystemDirectoryHandle to IndexedDB.
 * @param handle The FileSystemDirectoryHandle to save.
 * @returns A Promise that resolves with the unique key used to store the handle.
 */
export async function saveHandleToIDB(handle: FileSystemDirectoryHandle): Promise<IDBValidKey> {
  const database = await openDB();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  // Create a unique ID for this handle entry
  const id = handle.name + '-' + new Date().getTime();
  // Put the handle into the object store with its ID
  const request = store.put({ id: id, handle: handle });

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(id);
    request.onerror = (event) => reject('Error saving handle to IDB: ' + (event.target as IDBRequest).error);
  });
}

/**
 * Retrieves a FileSystemDirectoryHandle from IndexedDB using its key.
 * @param id The key of the handle to retrieve.
 * @returns A Promise that resolves with the FileSystemDirectoryHandle or null if not found.
 */
export async function getHandleFromIDB(id: IDBValidKey): Promise<FileSystemDirectoryHandle | null> {
  const database = await openDB();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      resolve(result ? result.handle : null);
    };
    request.onerror = (event) => reject('Error getting handle from IDB: ' + (event.target as IDBRequest).error);
  });
}

/**
 * Deletes a FileSystemDirectoryHandle entry from IndexedDB.
 * @param id The key of the handle to delete.
 * @returns A Promise that resolves when the deletion is complete.
 */
export async function deleteHandleFromIDB(id: IDBValidKey): Promise<void> {
  const database = await openDB();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const request = store.delete(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject('Error deleting handle from IDB: ' + (event.target as IDBRequest).error);
  });
}
