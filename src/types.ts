export interface BaseFileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  handle: FileSystemHandle;
}

export interface DirectoryEntry extends BaseFileEntry {
  isDirectory: true;
  handle: FileSystemDirectoryHandle;
}

export interface FileEntry extends BaseFileEntry {
  isDirectory: false;
  file: File;
  size: number;
  lastModified: number;
  type: string;
  handle: FileSystemFileHandle;
}

export type FileSystemEntry = DirectoryEntry | FileEntry;

export interface RecentProject {
  name: string;
  idbKey: IDBValidKey; // Key to retrieve the FileSystemDirectoryHandle from IndexedDB
  lastOpened: string;
}

export interface StartScreenProps {
  onOpenProject: () => void;
  recentProjects: RecentProject[];
  onOpenRecentProject: (project: RecentProject) => void;
}

export interface FileBrowserProps {
  currentPath: string;
  currentDirectory: FileSystemDirectoryHandle | null;
  onPathChange: (path: string, dirHandle: FileSystemDirectoryHandle) => void;
}
