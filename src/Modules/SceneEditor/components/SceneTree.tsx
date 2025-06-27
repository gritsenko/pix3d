import React, { useMemo, useEffect, useState } from 'react';
import { Popover, Switch } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';
// Helper to serialize a THREE.Object3D node to the desired format
function serializeObject3D(node: THREE.Object3D): any {
  // Helper to get vector3 as object
  const vec3 = (v: THREE.Vector3) => ({ x: v.x, y: v.y, z: v.z });
  // Helper to get Euler as object
  const euler = (e: THREE.Euler) => ({ x: e.x, y: e.y, z: e.z });
  // Get custom properties if present
  const anyNode = node as any;
  const obj: any = {
    name: node.name || node.type,
    modelName: anyNode.modelName || '',
    type: node.type,
    noCollider: !!anyNode.noCollider,
    animation: anyNode.animation || 'Idle',
    position: vec3(node.position),
    rotation: euler(node.rotation),
    scale: vec3(node.scale),
  };
  // Behaviors (if present)
  if (Array.isArray(anyNode.behaviors) && anyNode.behaviors.length > 0) {
    obj.behaviors = anyNode.behaviors.map((b: any) => {
      const beh: any = { ...b };
      // If checkpoints, ensure correct format
      if (Array.isArray(beh.checkpoints)) {
        beh.checkpoints = beh.checkpoints.map((cp: any) => ({
          position: cp.position ? vec3(cp.position) : undefined,
          rotation: cp.rotation ? euler(cp.rotation) : undefined,
        }));
      }
      return beh;
    });
  }
  return obj;
}

// Recursively collect all direct children of the root (not root itself)
function collectSceneObjects(root: THREE.Object3D): any[] {
  return root.children.map(child => serializeObject3D(child));
}
import SceneManager from '../../../Core/SceneManager';
import { Tree } from 'antd';
import * as THREE from 'three';
import Node3d from '../../../Core/ObjectTypes/Node3d';
import type { DataNode } from 'antd/es/tree';

interface SceneTreeProps {
  root: THREE.Object3D;
  selected: THREE.Object3D | null;
  onSelect: (obj: THREE.Object3D | null) => void;
}

function buildTreeData(node: THREE.Object3D, showAll: boolean, isRoot = false): DataNode | null {
  // Always show root node
  if (isRoot) {
    return {
      title: node.name || node.type,
      key: node.uuid,
      children: node.children
        .map(child => buildTreeData(child, showAll, false))
        .filter(Boolean) as DataNode[],
    };
  }
  // If not showAll, only include Node3d and its children
  const isNode3d = node instanceof Node3d;
  if (!showAll && !isNode3d) {
    // But if any children are Node3d, include them
    const filteredChildren = node.children
      .map(child => buildTreeData(child, showAll, false))
      .filter(Boolean) as DataNode[];
    if (filteredChildren.length === 0) return null;
    // If this node is not Node3d but has Node3d children, don't show this node, just its children
    return null;
  }
  return {
    title: node.name || node.type,
    key: node.uuid,
    children: node.children
      .map(child => buildTreeData(child, showAll, false))
      .filter(Boolean) as DataNode[],
  };
}


export const SceneTree: React.FC<SceneTreeProps> = ({ root, selected, onSelect }) => {
  // State to force update when object names change
  const [version, setVersion] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    // Force update when root changes
    setVersion(v => v + 1);
  }, [root]);

  useEffect(() => {
    // Subscribe to selection changes (which are triggered on name change)
    const unsub = SceneManager.instance.subscribeSelection(() => {
      setVersion(v => v + 1);
    });
    return () => { unsub(); };
  }, []);

  // Recompute treeData when root, version, or showAll changes
  const treeData = useMemo(() => {
    const data = buildTreeData(root, showAll, true);
    return data ? [data] : [];
  }, [root, version, showAll]);

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      // Prevent selecting the root scene node
      if (selectedKeys[0] === root.uuid) {
        onSelect(null);
        return;
      }
      const findObj = (node: THREE.Object3D, uuid: string): THREE.Object3D | null => {
        if (node.uuid === uuid) return node;
        for (const child of node.children) {
          const found = findObj(child, uuid);
          if (found) return found;
        }
        return null;
      };
      const obj = findObj(root, selectedKeys[0] as string);
      onSelect(obj);
    } else {
      onSelect(null);
    }
  };

  const popoverContent = (
    <div style={{ minWidth: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Switch checked={showAll} onChange={setShowAll} size="small" id="showAllSwitch" />
        <label htmlFor="showAllSwitch" style={{ fontSize: 13, color: '#eee', cursor: 'pointer' }}>Show all objects</label>
      </div>
    </div>
  );

  // Save handler
  const handleSave = async () => {
    try {
      // Use File System Access API if available
      // @ts-ignore
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: 'scene.json',
          types: [
            {
              description: 'JSON file',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        const data = JSON.stringify(collectSceneObjects(root), null, 2);
        await writable.write(data);
        await writable.close();
      } else {
        // Fallback: download as blob
        const data = JSON.stringify(collectSceneObjects(root), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (e) {
      alert('Failed to save scene: ' + (e instanceof Error ? e.message : e));
    }
  };

  return (
    <div style={{ position: 'relative', background: '#181818', borderRadius: 6, padding: 8, paddingTop: 32 }}>
      {/* Save button */}
      <div style={{ position: 'absolute', top: 6, left: 8, zIndex: 2 }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Save Scene"
          title="Save scene structure as JSON"
          onClick={handleSave}
        >
          <SaveOutlined style={{ fontSize: 18, color: '#4caf50' }} />
        </button>
      </div>
      {/* Gear icon button */}
      <div style={{ position: 'absolute', top: 6, right: 8, zIndex: 2 }}>
        <Popover
          content={popoverContent}
          trigger="click"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        >
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Settings"
          >
            <SettingOutlined style={{ fontSize: 18, color: '#aaa' }} />
          </button>
        </Popover>
      </div>
      <Tree
        treeData={treeData}
        selectedKeys={selected ? [selected.uuid] : []}
        onSelect={handleSelect}
        defaultExpandAll
        height={400}
        showLine
      />
    </div>
  );
};
