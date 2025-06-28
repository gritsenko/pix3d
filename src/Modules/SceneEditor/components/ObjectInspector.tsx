import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import SceneManager from '../../../Core/SceneManager';
import { EditMode } from './EditMode';

interface ObjectInspectorProps {
    object: THREE.Object3D | null;
    editModeRef?: React.RefObject<EditMode | null>;
}

type TransformField = 'position' | 'rotation' | 'scale';
type Axis = 'x' | 'y' | 'z';

export const ObjectInspector: React.FC<ObjectInspectorProps> = ({ object, editModeRef }) => {
    // Local state for each input field
    const [fields, setFields] = useState<{ [key in TransformField]: { [axis in Axis]: string } }>({
        position: { x: '', y: '', z: '' },
        rotation: { x: '', y: '', z: '' },
        scale: { x: '', y: '', z: '' },
    });

    // Animation state
    const [selectedAnim, setSelectedAnim] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
    const [actions, setActions] = useState<{ [name: string]: THREE.AnimationAction }>({});

    // Local visible state to force re-render
    const [visible, setVisible] = useState<boolean>(object?.visible ?? true);

    // Name state
    const [objectName, setObjectName] = useState<string>(object?.name || '');

    // Sync local state with object when object or its transform changes
    useEffect(() => {
        if (object) {
            const fmt = (n: number) => parseFloat(n.toFixed(4)).toString();
            setFields({
                position: {
                    x: fmt(object.position.x),
                    y: fmt(object.position.y),
                    z: fmt(object.position.z),
                },
                rotation: {
                    x: fmt(THREE.MathUtils.radToDeg(object.rotation.x)),
                    y: fmt(THREE.MathUtils.radToDeg(object.rotation.y)),
                    z: fmt(THREE.MathUtils.radToDeg(object.rotation.z)),
                },
                scale: {
                    x: fmt(object.scale.x),
                    y: fmt(object.scale.y),
                    z: fmt(object.scale.z),
                },
            });
            setObjectName(object.name || '');
            setVisible(object.visible);
        }
    }, [object, object?.position.x, object?.position.y, object?.position.z, object?.rotation.x, object?.rotation.y, object?.rotation.z, object?.scale.x, object?.scale.y, object?.scale.z, object?.visible]);
    // Handle name change
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setObjectName(e.target.value);
        if (object) {
            object.name = e.target.value;
            // Notify selection changed so SceneTree updates
            SceneManager.instance.notifySelectionChanged();
        }
    };

    // Setup mixer and actions when object changes
    useEffect(() => {
        if (object && (object as any).animations && (object as any).animations.length > 0) {
            const newMixer = new THREE.AnimationMixer(object);
            const anims = (object as any).animations as THREE.AnimationClip[];
            const acts: { [name: string]: THREE.AnimationAction } = {};
            anims.forEach(clip => {
                acts[clip.name] = newMixer.clipAction(clip);
            });
            setMixer(newMixer);
            setActions(acts);
            setSelectedAnim(anims[0].name);
        } else {
            setMixer(null);
            setActions({});
            setSelectedAnim('');
        }
        setIsPlaying(false);
    }, [object]);

    // Animation update loop (advance mixer)
    useEffect(() => {
        let frame: number;
        if (mixer && isPlaying) {
            const animate = () => {
                mixer.update(1 / 60);
                frame = requestAnimationFrame(animate);
            };
            frame = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(frame);
        }
    }, [mixer, isPlaying]);

    const handleInputChange = (field: TransformField, axis: Axis, value: string) => {
        setFields(prev => ({
            ...prev,
            [field]: { ...prev[field], [axis]: value }
        }));
        // Only update object if value is a valid number
        const num = parseFloat(value);
        if (!isNaN(num) && object) {
            if (field === 'position') object.position[axis] = num;
            if (field === 'scale') object.scale[axis] = num;
            if (field === 'rotation') object.rotation[axis] = THREE.MathUtils.degToRad(num);
            SceneManager.instance.emitTransform();
            if (editModeRef && editModeRef.current) {
                editModeRef.current.updateSelectionBox();
            }
        }
    };

    const handleInputBlur = (field: TransformField, axis: Axis, value: string) => {
        let num = parseFloat(value);
        if (isNaN(num)) num = 0;
        // Update object and local state
        if (object) {
            if (field === 'position') object.position[axis] = num;
            if (field === 'scale') object.scale[axis] = num;
            if (field === 'rotation') object.rotation[axis] = THREE.MathUtils.degToRad(num);
        }
        const fmt = (n: number) => parseFloat(n.toFixed(4)).toString();
        setFields(prev => ({
            ...prev,
            [field]: { ...prev[field], [axis]: fmt(num) }
        }));
        SceneManager.instance.emitTransform();
        if (editModeRef && editModeRef.current) {
            editModeRef.current.updateSelectionBox();
        }
    };

    // Play selected animation
    const handlePlay = () => {
        if (mixer && selectedAnim && actions[selectedAnim]) {
            Object.values(actions).forEach(a => { a.stop(); });
            actions[selectedAnim].reset().play();
            setIsPlaying(true);
        }
    };
    // Pause animation
    const handlePause = () => {
        if (mixer && selectedAnim && actions[selectedAnim]) {
            actions[selectedAnim].paused = true;
            setIsPlaying(false);
        }
    };
    // Reset animation
    const handleReset = () => {
        if (mixer && selectedAnim && actions[selectedAnim]) {
            actions[selectedAnim].reset();
            actions[selectedAnim].time = 0;
            actions[selectedAnim].stop();
            setIsPlaying(false);
        }
    };
    // Resume animation
    const handleResume = () => {
        if (mixer && selectedAnim && actions[selectedAnim]) {
            actions[selectedAnim].paused = false;
            setIsPlaying(true);
        }
    };
    // Animation dropdown change
    const handleAnimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const animName = e.target.value;
        setSelectedAnim(animName);
        // Immediately show the first frame of the selected animation
        if (actions[animName] && mixer) {
            actions[animName].reset();
            actions[animName].time = 0;
            actions[animName].play();
            actions[animName].paused = true;
            mixer.update(0); // force update pose
        }
        setIsPlaying(false);
    };

    // Handle visibility toggle
    const handleVisibilityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setVisible(checked);
        if (object) {
            object.visible = checked;
            SceneManager.instance.notifySelectionChanged();
        }
    };

    const inputStyle = {
        width: 62,
        fontSize: 13,
        marginRight: 4,
        padding: '2px 4px',
        background: '#222',
        color: '#eee',
        border: '1px solid #333',
        borderRadius: 3,
        boxSizing: 'border-box' as const,
    };

    const labelStyle = { fontSize: 12, color: '#aaa', marginRight: 12, display: 'inline-block', minWidth: 70 };
    const sectionTitle = { fontSize: 13, fontWeight: 600, margin: '10px 0 4px 0' };

    if (!object) {
        return <div style={{ padding: 12, fontSize: 13 }}>No object selected.</div>;
    }

    const { type } = object;

    return (
        <div style={{ padding: 12, fontSize: 13, color: '#eee', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Object Inspector</div>
            {type && <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{type}</div>}
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                <span style={labelStyle}>Name:</span>
                <input
                    type="text"
                    value={objectName}
                    style={{ ...inputStyle, width: 160 }}
                    onChange={handleNameChange}
                    placeholder="(unnamed)"
                />
            </div>
            <div style={sectionTitle}>Transform</div>
            <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                <span style={labelStyle}>Position:</span>
                {(['x', 'y', 'z'] as const).map(axis => (
                    <input
                        key={axis}
                        type="number"
                        step="0.01"
                        value={fields.position[axis]}
                        style={inputStyle}
                        onChange={e => handleInputChange('position', axis, e.target.value)}
                        onBlur={e => handleInputBlur('position', axis, e.target.value)}
                    />
                ))}
            </div>
            <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                <span style={labelStyle}>Rotation:</span>
                {(['x', 'y', 'z'] as const).map(axis => (
                    <input
                        key={axis}
                        type="number"
                        step="0.1"
                        value={fields.rotation[axis]}
                        style={inputStyle}
                        onChange={e => handleInputChange('rotation', axis, e.target.value)}
                        onBlur={e => handleInputBlur('rotation', axis, e.target.value)}
                    />
                ))} <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>&deg;</span>
            </div>
            <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                <span style={labelStyle}>Scale:</span>
                {(['x', 'y', 'z'] as const).map(axis => (
                    <input
                        key={axis}
                        type="number"
                        step="0.01"
                        value={fields.scale[axis]}
                        style={inputStyle}
                        onChange={e => handleInputChange('scale', axis, e.target.value)}
                        onBlur={e => handleInputBlur('scale', axis, e.target.value)}
                    />
                ))}
            </div>
            <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                <span style={labelStyle}>Visible:</span>
                <input
                    type="checkbox"
                    checked={visible}
                    onChange={handleVisibilityToggle}
                />
            </div>
            {/* Animation Controls */}
            {(object as any).animations && (object as any).animations.length > 0 && (
                <div style={{ margin: '12px 0' }}>
                    <div style={sectionTitle}>Animation</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                        <span style={labelStyle}>Clip:</span>
                        <select value={selectedAnim} onChange={handleAnimChange} style={{ ...inputStyle, width: 120 }}>
                            {((object as any).animations as THREE.AnimationClip[]).map(clip => (
                                <option key={clip.name} value={clip.name}>{clip.name}</option>
                            ))}
                        </select>
                        <button style={{ ...inputStyle, width: 50, marginLeft: 8 }} onClick={isPlaying ? handlePause : handlePlay}>
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button style={{ ...inputStyle, width: 50, marginLeft: 4 }} onClick={handleReset}>Reset</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ObjectInspector;
