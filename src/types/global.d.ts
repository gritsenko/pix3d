// This file contains type declarations for the global scope

// Extend the Window interface to include the File System Access API
declare interface Window {
  showDirectoryPicker: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  }) => Promise<FileSystemDirectoryHandle>;
}

// Declare the FileSystemHandle interface
declare interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
  isSameEntry: (other: FileSystemHandle) => Promise<boolean>;
  queryPermission: (options: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission: (options: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
}

// Declare the FileSystemDirectoryHandle interface
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

// Declare the FileSystemFileHandle interface
declare interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file';
  getFile: () => Promise<File>;
  createWritable: (options?: { keepExistingData?: boolean }) => Promise<FileSystemWritableFileStream>;
}
