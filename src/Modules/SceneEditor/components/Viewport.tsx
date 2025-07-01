import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Dropdown } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import { TransformToolbar } from './TransformToolbar';
import styles from './SceneEditor.module.css';
import SceneManager from '../../../Core/SceneManager';
import { EditMode } from './EditMode';
import CameraObject from '../../../Core/ObjectTypes/CameraObject';

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
  const [currentCamera, setCurrentCamera] = useState<'edit' | string>('edit');
  const currentCameraRef = useRef<'edit' | string>('edit');
  const [sceneCameras, setSceneCameras] = useState<CameraObject[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [scene, setScene] = useState(SceneManager.instance.scene); // Track the current scene

  // Function to find all cameras in the scene
  const findCamerasInScene = (scene: GameScene): CameraObject[] => {
    const cameras: CameraObject[] = [];
    scene.traverse((obj) => {
      if (obj instanceof CameraObject) {
        cameras.push(obj);
      }
    });
    return cameras;
  };

  // Function to update camera list
  const updateCameraList = () => {
    if (editModeRef.current) {
      const cameras = findCamerasInScene(editModeRef.current['scene']);
      setSceneCameras(cameras);
    }
  };

  // Handle camera switch
  const handleCameraSwitch = ({ key }: { key: string }) => {
    setCurrentCamera(key);
    currentCameraRef.current = key;
    if (editModeRef.current && rendererRef.current) {
      // Enable orbit controls only for edit camera
      editModeRef.current.orbitControls.enabled = key === 'edit';
      if (key === 'edit') {
        // Switch back to edit camera
        editModeRef.current.camera.aspect = rendererRef.current.domElement.clientWidth / rendererRef.current.domElement.clientHeight;
        editModeRef.current.camera.updateProjectionMatrix();
      } else {
        // Switch to scene camera
        const camera = sceneCameras.find(cam => cam.uuid === key);
        if (camera) {
          camera.camera.aspect = rendererRef.current.domElement.clientWidth / rendererRef.current.domElement.clientHeight;
          camera.camera.updateProjectionMatrix();
        }
      }
    }
  };

  // Subscribe to scene changes and update local scene state
  useEffect(() => {
    const unsub = SceneManager.instance.subscribeScene((newScene) => {
      setScene(newScene);
    });
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!mountRef.current || !scene) return;
    const currentMount = mountRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    if (onSceneChange) onSceneChange(scene);

    const editMode = new EditMode(renderer, scene);
    editModeRef.current = editMode;

    editMode.onSelect = (obj) => {
      SceneManager.instance.setSelected(obj);
      // Update camera list when selection changes (in case cameras are added/removed)
      const cameras = findCamerasInScene(scene);
      setSceneCameras(cameras);
    };

    // Initial camera list update
    const initialCameras = findCamerasInScene(scene);
    setSceneCameras(initialCameras);

    const handleResize = () => {
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      renderer.setSize(width, height);
      editMode.handleResize(width, height);
      // Update current camera aspect ratio
      if (currentCameraRef.current === 'edit') {
        editMode.camera.aspect = width / height;
        editMode.camera.updateProjectionMatrix();
      } else {
        const cameras = findCamerasInScene(scene);
        const cameraObj = cameras.find(cam => cam.uuid === currentCameraRef.current);
        if (cameraObj) {
          cameraObj.camera.aspect = width / height;
          cameraObj.camera.updateProjectionMatrix();
        }
      }
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
      // Render with current camera - get fresh camera reference each frame
      let renderCamera: THREE.PerspectiveCamera;
      if (currentCameraRef.current === 'edit') {
        renderCamera = editMode.camera;
      } else {
        // Get fresh camera list to avoid stale closure
        const currentCameras = findCamerasInScene(scene);
        const cameraObj = currentCameras.find(cam => cam.uuid === currentCameraRef.current);
        renderCamera = cameraObj?.camera || editMode.camera;
      }
      renderer.render(scene, renderCamera);
    };

    animate();
    setSceneReady(true);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.unobserve(currentMount);
      currentMount.removeChild(renderer.domElement);
      editMode.dispose();
      renderer.dispose();
      rendererRef.current = null;
    };
    // Re-run this effect when the scene changes
  }, [editModeRef, setSceneReady, scene]);

  useEffect(() => {
    editModeRef.current?.setTransformMode(transformMode);
  }, [transformMode, editModeRef]);

  // Update camera list when scene cameras change
  useEffect(() => {
    const interval = setInterval(updateCameraList, 1000); // Check for camera changes every second
    return () => clearInterval(interval);
  }, [editModeRef]);

  // Create camera dropdown menu
  const cameraMenuItems = [
    { key: 'edit', label: 'Edit Camera' },
    ...sceneCameras.map(cam => ({
      key: cam.uuid,
      label: cam.name || `Camera ${cam.uuid.slice(0, 8)}`
    }))
  ];

  const cameraMenu = {
    items: cameraMenuItems,
    onClick: handleCameraSwitch,
  };

  // Also, ensure orbit controls are enabled for edit camera on mount
  useEffect(() => {
    if (editModeRef.current) {
      editModeRef.current.orbitControls.enabled = currentCamera === 'edit';
    }
  }, [currentCamera, editModeRef]);

  return (
    <div className={styles.viewport} ref={mountRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <TransformToolbar mode={transformMode} onModeChange={setTransformMode} />
      
      {/* Camera Selector Dropdown */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000 }}>
        <Dropdown menu={cameraMenu} trigger={['click']} placement="bottomRight">
          <button
            style={{ 
              background: 'rgba(0, 0, 0, 0.7)', 
              border: '1px solid #444', 
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer', 
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12
            }}
            aria-label="Switch Camera"
            title="Switch between cameras"
          >
            <VideoCameraOutlined style={{ fontSize: 14 }} />
            {currentCamera === 'edit' ? 'Edit Camera' : sceneCameras.find(cam => cam.uuid === currentCamera)?.name || 'Camera'}
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

export default Viewport;
