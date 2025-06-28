// Service interfaces for dependency inversion
import * as THREE from 'three';
import type GameScene from '../Core/ObjectTypes/GameScene';

export interface I3DEngineService {
  createDefaultScene(): GameScene;
  setScene(scene: GameScene): void;
  clearScene(): void;
  addModelToScene(key: string, url: string, position?: THREE.Vector3): Promise<THREE.Object3D>;
  getSelectedObject(): THREE.Object3D | null;
  setSelectedObject(object: THREE.Object3D | null): void;
  subscribeToSceneChanges(callback: (scene: GameScene | null) => void): () => void;
  subscribeToSelectionChanges(callback: (object: THREE.Object3D | null) => void): () => void;
}

export interface IAssetService {
  loadModel(key: string, url: string): Promise<THREE.Object3D>;
  addAsset(type: string, key: string, url: string): void;
  getAsset(type: string, key: string): any;
}

export interface IFileSystemService {
  openDirectory(): Promise<FileSystemDirectoryHandle>;
  readDirectory(handle: FileSystemDirectoryHandle): Promise<FileSystemEntry[]>;
  saveHandle(handle: FileSystemDirectoryHandle): Promise<IDBValidKey>;
  getHandle(key: IDBValidKey): Promise<FileSystemDirectoryHandle | null>;
  deleteHandle(key: IDBValidKey): Promise<void>;
}

export interface FileSystemEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  handle: FileSystemHandle;
  file?: File;
  size?: number;
  lastModified?: number;
  type?: string;
}
