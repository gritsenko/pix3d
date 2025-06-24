import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { TransformToolbar } from './TransformToolbar';
import { SceneTree } from './SceneTree';
import styles from './SceneEditor.module.css';
import { EditMode } from './EditMode';
import GameScene from '../../../Core/ObjectTypes/GameScene';
import GameObject from '../../../Core/ObjectTypes/GameObject';
import { Transform } from '../../../Core/Runtime';

const SceneEditor: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const editModeRef = useRef<EditMode | null>(null);
    const sceneRef = useRef<GameScene | null>(null);

    const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    const [sceneReady, setSceneReady] = useState(false);

    useEffect(() => {
        if (!mountRef.current) return;

        const currentMount = mountRef.current;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);

        const scene = new GameScene();
        scene.init();
        sceneRef.current = scene;

        // Add default cube
        const geo = new THREE.BoxGeometry();
        const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cubeMesh = new THREE.Mesh(geo, mat);
        
        const transform: Transform = {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            quaternion: new THREE.Quaternion()
        };
        
        const mesh = new GameObject(cubeMesh, transform, []);
        scene.addGameObject(mesh);

        const editMode = new EditMode(renderer, scene);
        editModeRef.current = editMode;

        editMode.onSelect = (obj) => {
            setSelectedObject(obj);
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
    }, []);

    useEffect(() => {
        editModeRef.current?.setTransformMode(transformMode);
    }, [transformMode]);

    const handleSelectObject = (obj: THREE.Object3D | null) => {
        editModeRef.current?.selectObject(obj);
        setSelectedObject(obj);
    }

    return (
        <div className={styles.sceneEditorContainer}>
            <div className={styles.sceneHierarchy}>
                {sceneReady && sceneRef.current && (
                    <SceneTree
                        root={sceneRef.current}
                        selected={selectedObject}
                        onSelect={handleSelectObject}
                    />
                )}
            </div>
            <div className={styles.viewport} ref={mountRef}>
                <TransformToolbar mode={transformMode} onModeChange={setTransformMode} />
            </div>
        </div>
    );
};

export default SceneEditor;
