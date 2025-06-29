import GameScene from './ObjectTypes/GameScene';
import GameObject from './ObjectTypes/GameObject';
import * as THREE from 'three';
import { Transform } from './Runtime';
import AssetLoader from './Runtime/AssetLoader';
import SceneLoader from './Runtime/SceneLoader';
import { assetRegistry } from './Runtime/AssetsRegistry';

type SceneListener = (scene: GameScene | null) => void;
type SelectionListener = (selected: THREE.Object3D | null) => void;

export class SceneManager {
    private static _instance: SceneManager;
    private _scene: GameScene | null = null;
    private _selected: THREE.Object3D | null = null;
    private sceneListeners: SceneListener[] = [];
    private selectionListeners: SelectionListener[] = [];
    private assetLoader = new AssetLoader();
    private sceneLoader = new SceneLoader(this.assetLoader);
    private transformListeners: (() => void)[] = [];

    private constructor() {}

    public static get instance(): SceneManager {
        if (!SceneManager._instance) {
            SceneManager._instance = new SceneManager();
        }
        return SceneManager._instance;
    }

    get scene(): GameScene | null {
        return this._scene;
    }

    get selected(): THREE.Object3D | null {
        return this._selected;
    }

    /**
     * Creates a new scene with a default cube. You can extend this to load from file, etc.
     */
    createDefaultScene() {
        const scene = new GameScene();
        scene.init();

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

        this._scene = scene;
        this.emitScene();
        return scene;
    }

    /**
     * Replace the current scene with a new one (e.g., loaded from file)
     */
    setScene(scene: GameScene) {
        this._scene = scene;
        // Try to preserve selection by UUID if possible
        if (this._selected && this._selected.uuid) {
            const prevUUID = this._selected.uuid;
            // Recursively search for object with same UUID in new scene
            const findByUUID = (node: THREE.Object3D, uuid: string): THREE.Object3D | null => {
                if (node.uuid === uuid) return node;
                for (const child of node.children) {
                    const found = findByUUID(child, uuid);
                    if (found) return found;
                }
                return null;
            };
            const newSelected = findByUUID(scene, prevUUID);
            this._selected = newSelected || null;
        } else {
            this._selected = null;
        }
        this.emitScene();
        this.emitSelection();
    }

    /**
     * Clear the current scene
     */
    clearScene() {
        this._scene = null;
        this._selected = null;
        this.emitScene();
        this.emitSelection();
    }

    setSelected(obj: THREE.Object3D | null) {
        this._selected = obj;
        if (obj) {
            // eslint-disable-next-line no-console
            console.log('[SceneManager] Selected object:', obj);
        } else {
            // eslint-disable-next-line no-console
            console.log('[SceneManager] Selection cleared');
        }
        this.emitSelection();
    }

    subscribeScene(listener: SceneListener) {
        this.sceneListeners.push(listener);
        return () => {
            this.sceneListeners = this.sceneListeners.filter(l => l !== listener);
        };
    }

    subscribeSelection(listener: SelectionListener) {
        this.selectionListeners.push(listener);
        return () => {
            this.selectionListeners = this.selectionListeners.filter(l => l !== listener);
        };
    }

    subscribeTransform(listener: () => void) {
        this.transformListeners.push(listener);
        return () => {
            this.transformListeners = this.transformListeners.filter(l => l !== listener);
        };
    }

    private emitScene() {
        // Emit the live scene object instead of a shallow clone
        for (const l of this.sceneListeners) l(this._scene);
    }
    private emitSelection() {
        for (const l of this.selectionListeners) l(this._selected);
    }
    emitTransform() {
        for (const l of this.transformListeners) l();
    }

    /**
     * Adds a GLB model to the scene. If not loaded, adds to registry and loads it.
     * @param key The asset key (e.g. 'robot_glb')
     * @param url The asset URL
     * @param position Optional position for the new object
     */
    async AddModelToScene(key: string, url: string, position?: THREE.Vector3) {
        // Add to registry if not present
        if (!assetRegistry.assets.models[key]) {
            assetRegistry.addAsset('models', key, url);
            // Wait for the model to be loaded by AssetLoader
            await this.assetLoader.loadModel(key);
        }
        // Prepare a fake item config for SceneLoader
        const item = {
            name: key,
            modelName: key,
            position: position || { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            behaviors: [],
            noCollider: false
        };
        // Use SceneLoader to create a GameObject
        const gameObject = this.sceneLoader.loadGameObject(item);
        if (this._scene) {
            this._scene.addGameObject(gameObject);
            this.emitScene();
            this.setSelected(gameObject); // Select the newly added object
        }
    }

    /**
     * Notify listeners that the selection has changed, even if the object reference is the same.
     * Useful for forcing UI updates after transform controls.
     */
    notifySelectionChanged() {
        this.emitSelection();
    }

    /**
     * Deletes the given object from the scene, if present.
     * If the object is currently selected, clears the selection.
     * @param selectedObject The object to delete
     */
    deleteObject(selectedObject: THREE.Object3D) {
        if (!this._scene || !selectedObject) return;
        // Remove from scene graph
        if (selectedObject.parent) {
            selectedObject.parent.remove(selectedObject);
        } else {
            // If it's a root GameObject in GameScene
            this._scene.removeGameObject?.(selectedObject as GameObject);
        }
        // Clear selection if deleted object was selected
        if (this._selected === selectedObject) {
            this.setSelected(null);
        } else {
            this.emitScene();
        }
    }

    /**
     * Loads a scene from a JSON definition, replacing the current scene.
     * @param levelJson The JSON scene definition
     */
    async loadSceneFromJson(levelJson: any) {
        // Clear current scene
        this.clearScene();
        // Use SceneLoader to create a new GameScene from JSON
        const newScene = this.sceneLoader.loadSceneFromJson(levelJson);
        // Set and initialize the new scene
        if (newScene && typeof newScene.init === 'function') {
            newScene.init();
        }
        this.setScene(newScene);
    }
}

export default SceneManager;
