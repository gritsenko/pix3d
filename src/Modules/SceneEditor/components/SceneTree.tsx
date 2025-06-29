import React, { useMemo, useEffect, useState } from 'react';
import { Popover, Switch, Tree } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';
import { saveSceneToFile } from '../../../Core/SceneSaver';
import * as THREE from 'three';
import Node3d from '../../../Core/ObjectTypes/Node3d';
import type { DataNode } from 'antd/es/tree';
import SceneManager from '../../../Core/SceneManager';

interface SceneTreeProps {
  root: THREE.Object3D;
  selected: THREE.Object3D | null;
  onSelect: (obj: THREE.Object3D | null) => void;
}

function buildTreeData(node: THREE.Object3D, showAll: boolean, isRoot = false): DataNode | null {
  // Always show root node
  if (isRoot) {
    return {
      title: (
        <span style={{ opacity: node.visible ? 1 : 0.8 }}>
          {formatTitle(node)}
        </span>
      ),
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
    title: (
      <span style={{ opacity: node.visible ? 1 : 0.7 }}>
        {formatTitle(node)}
      </span>
    ),
    key: node.uuid,
    children: node.children
      .map(child => buildTreeData(child, showAll, false))
      .filter(Boolean) as DataNode[],
  };
// Helper to format the title with object type in brackets
function formatTitle(node: THREE.Object3D): string {
  const name = node.name || node.type;
  // Use the class name for custom types, otherwise fallback to node.type
  let typeName = node.constructor && node.constructor.name ? node.constructor.name : node.type;
  // Avoid duplicate type if name is already the type
  if (name === typeName) {
    return name;
  }
  return `${name} [${typeName}]`;
}
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
    console.log('Rebuilding scene tree data', root.name, root.uuid, 'showAll:', showAll);
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
    await saveSceneToFile(root);
  };

  return (
    <div style={{ position: 'relative', background: '#181818', borderRadius: 6, padding: 8, paddingTop: 32, width: '100%' }}>
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
        showLine
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};
