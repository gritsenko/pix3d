// Extend the FileSystemHandle interface to include the queryPermission method
declare interface FileSystemHandle {
  queryPermission: (options: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission: (options: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
  readonly kind: 'file' | 'directory';
  readonly name: string;
  isSameEntry: (other: FileSystemHandle) => Promise<boolean>;
}

declare interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
  removeEntry: (name: string, options?: { recursive?: boolean }) => Promise<void>;
  resolve: (possibleDescendant: FileSystemHandle) => Promise<string[] | null>;
  keys: () => AsyncIterableIterator<string>;
  values: () => AsyncIterableIterator<FileSystemHandle>;
  entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
  [Symbol.asyncIterator]: () => AsyncIterableIterator<[string, FileSystemHandle]>;
}

declare interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file';
  getFile: () => Promise<File>;
  createWritable: (options?: { keepExistingData?: boolean }) => Promise<FileSystemWritableFileStream>;
}

// Extend the Window interface to include showDirectoryPicker
declare global {
  interface Window {
    showDirectoryPicker: (options?: {
      id?: string;
      mode?: 'read' | 'readwrite';
      startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }

  // This is needed to make TypeScript recognize the global types
  const FileSystemHandle: {
    prototype: FileSystemHandle;
    new(): FileSystemHandle;
  };

  const FileSystemDirectoryHandle: {
    prototype: FileSystemDirectoryHandle;
    new(): FileSystemDirectoryHandle;
  };

  const FileSystemFileHandle: {
    prototype: FileSystemFileHandle;
    new(): FileSystemFileHandle;
  };
}
