import * as THREE from 'three';
import AssetLoader from './AssetLoader';
import GameScene from '../ObjectTypes/GameScene';
import GameObject from '../ObjectTypes/GameObject';
import { Behavior } from '../Behaviors/Behavior';
import { MoveByCheckpoints } from '../Behaviors/MoveByCheckppoints';
import { Destructable } from '../Behaviors/Destructable';
import { GameObjectCollider } from '../ObjectTypes/GameObjectCollider';
import { MeleeAttacker } from '../Behaviors/MeleeAttacker';

export default class SceneLoader {
    assetLoader: AssetLoader;

    constructor(assetLoader: AssetLoader) {
        this.assetLoader = assetLoader;
    }

    loadSceneFromJson(levelJson: any) {

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

        (levelJson as LevelItem[]).forEach((item: LevelItem) => {

            if (item.modelName.endsWith('glb')) {
            const gameObject = this.loadGameObject(item);
            gameObjects.push(gameObject);
            }
        });

        scene.setGameObjects(gameObjects);
        return scene;
    }

    loadGameObject(item: any): GameObject {

        //console.log("loding item", item);

        const transform = {
            position: new THREE.Vector3(item.position.x, item.position.y, item.position.z),
            rotation: new THREE.Euler(item.rotation.x, item.rotation.y, item.rotation.z),
            scale: new THREE.Vector3(item.scale.x, item.scale.y, item.scale.z),
            quaternion: new THREE.Quaternion()
        };

        const gameObject = this.assetLoader.loadGltfToGameObject(item.name, item.modelName, transform);
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