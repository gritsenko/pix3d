import React, { useRef, useEffect, useState } from 'react';
import { Layout } from 'antd';
import ResizableDivider from './ResizableDivider';
import * as THREE from 'three';
// import { TransformToolbar } from './TransformToolbar';
import Viewport from './Viewport';
import { SceneTree } from './SceneTree';
import styles from './SceneEditor.module.css';
import { EditMode } from './EditMode';
import SceneManager from '../../../Core/SceneManager';
import { ObjectInspector } from './ObjectInspector';

const SceneEditor: React.FC = () => {
    // const mountRef = useRef<HTMLDivElement>(null);
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

        // Key handler for Delete key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedObject) {
                e.preventDefault();
                if (window.confirm('Are you sure you want to delete the selected object?')) {
                    SceneManager.instance.deleteObject(selectedObject);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            unsubScene();
            unsubSel();
            unsubTransform();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedObject]);

    // ...existing code...

    // ...existing code...

    const handleSelectObject = (obj: THREE.Object3D | null) => {
        editModeRef.current?.selectObject(obj);
        SceneManager.instance.setSelected(obj);
    }

    // State for resizable columns
    const [leftWidth, setLeftWidth] = useState(240);
    const [rightWidth, setRightWidth] = useState(320);
    const minLeft = 120, maxLeft = 400, minRight = 180, maxRight = 480;

    const handleLeftResize = (dx: number) => {
        setLeftWidth(w => Math.max(minLeft, Math.min(maxLeft, w + dx)));
    };
    const handleRightResize = (dx: number) => {
        setRightWidth(w => Math.max(minRight, Math.min(maxRight, w - dx)));
    };

    return (
        <Layout className={styles.sceneEditorContainer} style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'row', minWidth: 0 }}>
            <div
                className={styles.sceneHierarchy}
                style={{ overflow: 'auto', minWidth: minLeft, maxWidth: maxLeft, width: leftWidth, borderRight: '1px solid #222', flexShrink: 0 }}
            >
                {sceneReady && scene && (
                    <SceneTree
                        root={scene}
                        selected={selectedObject}
                        onSelect={handleSelectObject}
                    />
                )}
            </div>
            <ResizableDivider onDrag={handleLeftResize} />
            <div style={{ flex: 1, minWidth: 0, background: 'none', display: 'flex', flexDirection: 'row', position: 'relative' }}>
                <Viewport
                    transformMode={transformMode}
                    setTransformMode={setTransformMode}
                    editModeRef={editModeRef}
                    setSceneReady={setSceneReady}
                    onSceneChange={setScene}
                />
            </div>
            <ResizableDivider onDrag={handleRightResize} />
            <div
                className={styles.objectInspector}
                style={{ overflow: 'auto', minWidth: minRight, maxWidth: maxRight, width: rightWidth, borderLeft: '1px solid #222', flexShrink: 0 }}
            >
                <ObjectInspector object={selectedObject} editModeRef={editModeRef} />
            </div>
        </Layout>
    );
};

export default SceneEditor;
