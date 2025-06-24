import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { TransformToolbar } from './TransformToolbar';
import { SceneTree } from './SceneTree';
import styles from './SceneEditor.module.css';
import { EditMode } from './EditMode';
import SceneManager from '../../../Core/SceneManager';
import { ObjectInspector } from './ObjectInspector';

const SceneEditor: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const editModeRef = useRef<EditMode | null>(null);

    const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(SceneManager.instance.selected);
    const [scene, setScene] = useState(SceneManager.instance.scene);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    const [sceneReady, setSceneReady] = useState(false);
    const [, forceUpdate] = useState(0); // for transform updates

    useEffect(() => {
        // Subscribe to SceneManager updates
        const unsubScene = SceneManager.instance.subscribeScene(setScene);
        const unsubSel = SceneManager.instance.subscribeSelection(setSelectedObject);
        const unsubTransform = SceneManager.instance.subscribeTransform(() => forceUpdate(n => n + 1));
        return () => {
            unsubScene();
            unsubSel();
            unsubTransform();
        };
    }, []);

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
    }, []);

    useEffect(() => {
        editModeRef.current?.setTransformMode(transformMode);
    }, [transformMode]);

    const handleSelectObject = (obj: THREE.Object3D | null) => {
        editModeRef.current?.selectObject(obj);
        SceneManager.instance.setSelected(obj);
    }

    return (
        <div className={styles.sceneEditorContainer}>
            <div className={styles.sceneHierarchy}>
                {sceneReady && scene && (
                    <SceneTree
                        root={scene}
                        selected={selectedObject}
                        onSelect={handleSelectObject}
                    />
                )}
            </div>
            <div className={styles.viewport} ref={mountRef}>
                <TransformToolbar mode={transformMode} onModeChange={setTransformMode} />
            </div>
            <div className={styles.objectInspector}>
                <ObjectInspector object={selectedObject} editModeRef={editModeRef} />
            </div>
        </div>
    );
};

export default SceneEditor;
