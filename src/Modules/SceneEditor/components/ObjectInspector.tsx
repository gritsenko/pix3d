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
        }
    }, [object, object?.position.x, object?.position.y, object?.position.z, object?.rotation.x, object?.rotation.y, object?.rotation.z, object?.scale.x, object?.scale.y, object?.scale.z]);

    if (!object) {
        return <div style={{ padding: 12, fontSize: 13 }}>No object selected.</div>;
    }

    const { name, type } = object;

    const handleInputChange = (field: TransformField, axis: Axis, value: string) => {
        setFields(prev => ({
            ...prev,
            [field]: { ...prev[field], [axis]: value }
        }));
        // Only update object if value is a valid number
        const num = parseFloat(value);
        if (!isNaN(num)) {
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
        if (field === 'position') object.position[axis] = num;
        if (field === 'scale') object.scale[axis] = num;
        if (field === 'rotation') object.rotation[axis] = THREE.MathUtils.degToRad(num);
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

    return (
        <div style={{ padding: 12, fontSize: 13, color: '#eee', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Object Inspector</div>
            {type && <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{type}</div>}
            <div style={{ marginBottom: 8 }}>
                <span style={labelStyle}>Name:</span> {name || '(unnamed)'}
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
        </div>
    );
};

export default ObjectInspector;
