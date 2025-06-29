import * as THREE from 'three';
import Node3d from './Node3d';
import { Behavior } from '../Behaviors/Behavior';

export interface IGameScene {
    onTick(dt: number): void;
}

export default class GameScene extends THREE.Scene implements IGameScene {
    private nodes: Node3d[] = [];

    constructor() {
        super();

        this.background = new THREE.Color(0x444444);
    }

    init() {
        this.addBasicLights();
        this.addHemisphereLight();
    }

    addBasicLights() {
        // Ambient light - provides global illumination
        const ambientLight = new THREE.AmbientLight('#FFFFFF', 1.6); // color, intensity
        ambientLight.name = 'ambient_light';

        // Directional light - mimics sunlight
        const directionalLight = new THREE.DirectionalLight('#FFFFFF', 2 * Math.PI); // color, intensity
        directionalLight.name = 'main_light';
        //const directionalHelper = new THREE.DirectionalLightHelper(directionalLight, 5); // size of the helper
        //this.add(directionalHelper);

        this.add(ambientLight);
        directionalLight.position.set(0.5, 4.3, 0.866); // ~60º angle
        //directionalLight.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
        this.add(directionalLight);


        return [ambientLight, directionalLight];
    }

    // Option 2: Simple hemisphere lighting setup
    addHemisphereLight() {
        const hemiLight = new THREE.HemisphereLight();
        hemiLight.name = 'hemi_light';
        this.add(hemiLight);

        return [hemiLight];
    }
    setGameObjects(nodes: Node3d[]) {
        this.nodes = nodes;

        nodes.forEach(x => {
            if (x) this.add(x);
        });
    }

    addGameObject(node: Node3d) {
        if (node) {
            this.nodes.push(node);
            this.add(node);
        }
    }

    getGameObjects() {
        return this.nodes;
    }

    findbjectByName(name: string): Node3d {
        const result = this.nodes.find(x => x.name == name);
        if (result)
            return result;
        else
            throw new Error(`GameObject ${name} not found`);
    }

    onTick(dt: number) {
        this.children.forEach(x => {
            if (x instanceof Node3d && x.isActive) {
                x.update(dt);
            }

            Behavior.ObjectBehaviorsOnTick(x, dt);
        });
    }

    removeGameObject(node: Node3d) {
        this.remove(node);
        this.nodes = this.nodes.filter(obj => obj !== node);
    }
}