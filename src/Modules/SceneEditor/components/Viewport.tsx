import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { TransformToolbar } from './TransformToolbar';
import styles from './SceneEditor.module.css';
import SceneManager from '../../../Core/SceneManager';
import { EditMode } from './EditMode';

import type GameScene from '../../../Core/ObjectTypes/GameScene';
interface ViewportProps {
  transformMode: 'translate' | 'rotate' | 'scale';
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  editModeRef: React.MutableRefObject<EditMode | null>;
  setSceneReady: (ready: boolean) => void;
  onSceneChange?: (scene: GameScene) => void;
}

const Viewport: React.FC<ViewportProps> = ({ transformMode, setTransformMode, editModeRef, setSceneReady, onSceneChange }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);


    let scene = SceneManager.instance.scene;
    if (!scene) {
      scene = SceneManager.instance.createDefaultScene();
      if (onSceneChange) onSceneChange(scene);
    } else {
      if (onSceneChange) onSceneChange(scene);
    }

    const editMode = new EditMode(renderer, scene);
    editModeRef.current = editMode;

    editMode.onSelect = (obj) => {
      SceneManager.instance.setSelected(obj);
    };

    const handleResize = () => {
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      renderer.setSize(width, height);
      editMode.handleResize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(currentMount);

    const clock = new THREE.Clock();
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      editMode.update();
      scene.onTick(dt);
      renderer.render(scene, editMode.camera);
    };

    animate();
    setSceneReady(true);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.unobserve(currentMount);
      currentMount.removeChild(renderer.domElement);
      editMode.dispose();
      renderer.dispose();
    };
  }, [editModeRef, setSceneReady]);

  useEffect(() => {
    editModeRef.current?.setTransformMode(transformMode);
  }, [transformMode, editModeRef]);

  return (
    <div className={styles.viewport} ref={mountRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <TransformToolbar mode={transformMode} onModeChange={setTransformMode} />
    </div>
  );
};

export default Viewport;
