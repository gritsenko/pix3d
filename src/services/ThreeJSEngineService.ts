// Concrete implementation of 3D engine service
import * as THREE from 'three';
import type GameScene from '../Core/ObjectTypes/GameScene';
import type { I3DEngineService } from './interfaces';
import SceneManager from '../Core/SceneManager';

export class ThreeJSEngineService implements I3DEngineService {
  private sceneManager: typeof SceneManager.instance;

  constructor() {
    this.sceneManager = SceneManager.instance;
  }

  createDefaultScene(): GameScene {
    return this.sceneManager.createDefaultScene();
  }

  setScene(scene: GameScene): void {
    this.sceneManager.setScene(scene);
  }

  clearScene(): void {
    this.sceneManager.clearScene();
  }

  async addModelToScene(key: string, url: string, position?: THREE.Vector3): Promise<THREE.Object3D> {
    await this.sceneManager.AddModelToScene(key, url, position);
    return this.sceneManager.selected!;
  }

  getSelectedObject(): THREE.Object3D | null {
    return this.sceneManager.selected;
  }

  setSelectedObject(object: THREE.Object3D | null): void {
    this.sceneManager.setSelected(object);
  }

  subscribeToSceneChanges(callback: (scene: GameScene | null) => void): () => void {
    return this.sceneManager.subscribeScene(callback);
  }

  subscribeToSelectionChanges(callback: (object: THREE.Object3D | null) => void): () => void {
    return this.sceneManager.subscribeSelection(callback);
  }
}
