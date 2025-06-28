import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';
import type GameScene from '../Core/ObjectTypes/GameScene';
import type { SceneState, SceneActions } from './types';

interface SceneStore extends SceneState, SceneActions {}

export const useSceneStore = create<SceneStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    scene: null,
    selectedObject: null,
    isLoading: false,

    // Actions
    setScene: (scene: GameScene | null) => {
      set({ scene });
    },

    setSelectedObject: (object: THREE.Object3D | null) => {
      set({ selectedObject: object });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    addModelToScene: async (key: string, url: string, position?: THREE.Vector3) => {
      const state = get();
      if (!state.scene) return;

      try {
        set({ isLoading: true });
        
        // This would be injected via a service in the full implementation
        const SceneManager = await import('../Core/SceneManager');
        await SceneManager.default.instance.AddModelToScene(key, url, position);
        
        // Update selected object
        set({ selectedObject: SceneManager.default.instance.selected });
      } catch (error) {
        console.error('Failed to add model to scene:', error);
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);
