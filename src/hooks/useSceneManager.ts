// Custom hooks for business logic separation
import { useEffect } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../stores/sceneStore';
import type { I3DEngineService } from '../services/interfaces';

export function useSceneManager(engineService: I3DEngineService) {
  const {
    scene,
    selectedObject,
    isLoading,
    setScene,
    setSelectedObject,
    addModelToScene,
  } = useSceneStore();

  // Subscribe to engine changes
  useEffect(() => {
    const unsubscribeScene = engineService.subscribeToSceneChanges(setScene);
    const unsubscribeSelection = engineService.subscribeToSelectionChanges(setSelectedObject);

    return () => {
      unsubscribeScene();
      unsubscribeSelection();
    };
  }, [engineService, setScene, setSelectedObject]);

  // Initialize default scene if none exists
  useEffect(() => {
    if (!scene) {
      const defaultScene = engineService.createDefaultScene();
      setScene(defaultScene);
    }
  }, [scene, engineService, setScene]);

  return {
    scene,
    selectedObject,
    isLoading,
    addModelToScene,
    setSelectedObject: (obj: THREE.Object3D | null) => {
      engineService.setSelectedObject(obj);
    },
    clearScene: () => {
      engineService.clearScene();
    },
  };
}
