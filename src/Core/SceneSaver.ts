import * as THREE from 'three';
import Node3d from './ObjectTypes/Node3d';

// Helper to serialize a Node3d object
function serializeNode3d(node: Node3d): any {
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

// Recursively collect all Node3d children of the root (not root itself)
export function collectNode3dObjects(root: THREE.Object3D): any[] {
  const result: any[] = [];
  const traverse = (node: THREE.Object3D) => {
    for (const child of node.children) {
      if (child instanceof Node3d) {
        result.push(serializeNode3d(child));
      }
      traverse(child);
    }
  };
  traverse(root);
  return result;
}

// Save scene to file (browser)
export async function saveSceneToFile(root: THREE.Object3D) {
  try {
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
      const data = JSON.stringify(collectNode3dObjects(root), null, 2);
      await writable.write(data);
      await writable.close();
    } else {
      const data = JSON.stringify(collectNode3dObjects(root), null, 2);
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
}
