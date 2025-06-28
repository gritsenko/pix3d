// Store interfaces for type safety and dependency inversion
import * as THREE from 'three';
import type { FileSystemEntry } from '../types';
import type GameScene from '../Core/ObjectTypes/GameScene';

export interface SceneState {
  scene: GameScene | null;
  selectedObject: THREE.Object3D | null;
  isLoading: boolean;
}

export interface ProjectState {
  hasProjectOpen: boolean;
  currentDirectory: FileSystemDirectoryHandle | null;
  currentPath: string;
  recentProjects: RecentProject[];
}

export interface FileSystemState {
  files: FileSystemEntry[];
  selectedFile: FileSystemEntry | null;
  isLoading: boolean;
}

export interface RecentProject {
  name: string;
  idbKey: IDBValidKey;
  lastOpened: string;
}

// Store actions
export interface SceneActions {
  setScene: (scene: GameScene | null) => void;
  setSelectedObject: (object: THREE.Object3D | null) => void;
  setLoading: (loading: boolean) => void;
  addModelToScene: (key: string, url: string, position?: THREE.Vector3) => Promise<void>;
}

export interface ProjectActions {
  openProject: () => Promise<void>;
  openRecentProject: (project: RecentProject) => Promise<void>;
  closeProject: () => void;
  setCurrentPath: (path: string, dirHandle: FileSystemDirectoryHandle) => void;
}

export interface FileSystemActions {
  loadFiles: (directory: FileSystemDirectoryHandle, path: string) => Promise<void>;
  selectFile: (file: FileSystemEntry | null) => void;
  setLoading: (loading: boolean) => void;
}
