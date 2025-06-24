import React, { useMemo } from 'react';
import { Tree } from 'antd';
import * as THREE from 'three';
import type { DataNode } from 'antd/es/tree';

interface SceneTreeProps {
  root: THREE.Object3D;
  selected: THREE.Object3D | null;
  onSelect: (obj: THREE.Object3D | null) => void;
}

function buildTreeData(node: THREE.Object3D): DataNode {
  return {
    title: node.name || node.type,
    key: node.uuid,
    children: node.children.map(child => buildTreeData(child)),
  };
}

export const SceneTree: React.FC<SceneTreeProps> = ({ root, selected, onSelect }) => {
  const treeData = useMemo(() => [buildTreeData(root)], [root]);

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
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

  return (
    <Tree
      treeData={treeData}
      selectedKeys={selected ? [selected.uuid] : []}
      onSelect={handleSelect}
      defaultExpandAll
      height={400}
      showLine
    />
  );
};
