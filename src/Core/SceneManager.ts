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
        this.emitScene();
    }

    /**
     * Clear the current scene
     */
    clearScene() {
        this._scene = null;
        this.emitScene();
    }

    setSelected(obj: THREE.Object3D | null) {
        this._selected = obj;
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
        // Emit a shallow clone to ensure React state updates
        const sceneToEmit = this._scene ? Object.assign(Object.create(Object.getPrototypeOf(this._scene)), this._scene) : null;
        for (const l of this.sceneListeners) l(sceneToEmit);
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
}

export default SceneManager;
