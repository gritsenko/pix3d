import * as THREE from 'three';
import AssetLoader from './AssetLoader';
import GameScene from '../ObjectTypes/GameScene';
import GameObject from '../ObjectTypes/GameObject';
import { Behavior } from '../Behaviors/Behavior';
import { MoveByCheckpoints } from '../Behaviors/MoveByCheckppoints';
import { Destructable } from '../Behaviors/Destructable';
import { GameObjectCollider } from '../ObjectTypes/GameObjectCollider';
import { MeleeAttacker } from '../Behaviors/MeleeAttacker';
import { assetRegistry } from './AssetsRegistry';

export default class SceneLoader {
    assetLoader: AssetLoader;

    constructor(assetLoader: AssetLoader) {
        this.assetLoader = assetLoader;
    }

    async loadSceneFromJson(levelJson: any) {

        const scene = new GameScene();
        const gameObjects: GameObject[] = [];
        interface LevelItem {
            name: string;
            modelName: string;
            position: { x: number; y: number; z: number };
            rotation: { x: number; y: number; z: number };
            scale: { x: number; y: number; z: number };
            quaternion?: { x: number; y: number; z: number; w: number };
            behaviors?: BehaviorConfig[];
            noCollider?: boolean;
            animation?: string;
        }

        interface BehaviorConfig {
            type: string;
            [key: string]: any;
        }

        // First, collect all unique model names and ensure they are loaded
        const modelNames = new Set<string>();
        (levelJson as LevelItem[]).forEach((item: LevelItem) => {
            if (item.modelName && item.modelName.endsWith('glb')) {
                modelNames.add(item.modelName);
            }
        });

        console.log('Models required by scene:', Array.from(modelNames));
        
        // Log current asset registry for debugging
        assetRegistry.logRegisteredAssets();

        // Load all required models
        for (const modelName of modelNames) {
            try {
                // Check if model is already loaded
                if (this.assetLoader.gltfs.find(x => x.key === modelName)) {
                    console.log(`Model ${modelName} is already loaded`);
                    continue;
                }
                
                // Check if model is registered in AssetRegistry
                if (!assetRegistry.assets.models[modelName]) {
                    console.error(`Model ${modelName} not found in asset registry.`);
                    console.log('Available models in registry:', Object.keys(assetRegistry.assets.models));
                    console.info(`To load this scene properly, please:
1. Use the file browser to navigate to the model file: ${modelName}
2. Click "Add to scene" on the model file to register it
3. Then try loading the scene again`);
                    continue;
                }
                
                const modelUrl = assetRegistry.assets.models[modelName];
                console.log(`Loading model ${modelName} from registry...`);
                console.log(`Model URL: ${typeof modelUrl === 'string' ? modelUrl : 'Not a string'}`);
                
                // Now try to load it
                await this.assetLoader.loadModel(modelName);
                console.log(`Successfully loaded model ${modelName}`);
            } catch (error) {
                console.error(`Failed to load model ${modelName}:`, error);
                console.warn(`Model ${modelName} is not available. Make sure the model file exists and is accessible.`);
                // Continue with other models even if one fails
            }
        }

        // Now create game objects
        (levelJson as LevelItem[]).forEach((item: LevelItem) => {
            if (item.modelName && item.modelName.endsWith('glb')) {
                try {
                    // Check if the model was successfully loaded
                    if (this.assetLoader.gltfs.find(x => x.key === item.modelName)) {
                        const gameObject = this.loadGameObject(item);
                        if (gameObject) {
                            gameObjects.push(gameObject);
                        }
                    } else {
                        console.warn(`Skipping object ${item.name} because model ${item.modelName} is not loaded`);
                    }
                } catch (error) {
                    console.error(`Failed to create game object ${item.name}:`, error);
                    // Continue with other objects
                }
            }
        });

        scene.setGameObjects(gameObjects);
        return scene;
    }

    loadGameObject(item: any): GameObject | null {

        //console.log("loding item", item);

        const transform = {
            position: new THREE.Vector3(item.position.x, item.position.y, item.position.z),
            rotation: new THREE.Euler(item.rotation.x, item.rotation.y, item.rotation.z),
            scale: new THREE.Vector3(item.scale.x, item.scale.y, item.scale.z),
            quaternion: new THREE.Quaternion()
        };

        const gameObject = this.assetLoader.loadGltfToGameObject(item.name, item.modelName, transform);
        if (!gameObject) {
            console.error(`Failed to create game object for ${item.name}`);
            return null;
        }
        
        const behaviors: Behavior[] = [];

        item.behaviors?.forEach((behaviorItem: any) => {
            const behavior = this.loadBehaviors(behaviorItem);
            if (behavior) {
                behaviors.push(behavior);
            }
        })

        gameObject.setBehaviors(behaviors);

        if (!item.noCollider)
            this.createCollider(gameObject);

        if (item.animation) {
            gameObject.playAnimation(item.animation);
        }

        //console.log(gameObject);
        return gameObject;
    }

    loadBehaviors(config?: any): Behavior | undefined {
        if (config.type === "MoveByCheckpoints") {
            return new MoveByCheckpoints(config);
        }

        if (config.type === "Destructable") {
            return new Destructable(config);
        }

        if (config.type === "MeleeAttacker") {
            return new MeleeAttacker(config);
        }

        return undefined;
    }


    createCollider(gameObject: GameObject) {
        const cubeCollider = new GameObjectCollider();
        cubeCollider.position.set(0, 1, 0);
        cubeCollider.scale.set(0.8, 1.1, 0.8);

        gameObject.setCollider(cubeCollider);
    }


}