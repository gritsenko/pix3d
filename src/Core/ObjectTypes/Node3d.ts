import * as THREE from 'three';
import type { Behavior } from '../Behaviors/Behavior';
import { Transform } from '../Runtime';

export default class Node3d extends THREE.Object3D {
    behaviors: Behavior[] = [];
    isActive: boolean = true;

    constructor() {
        super();
    }

    setTransform(transform: Transform) {
        this.position.copy(transform.position);
        this.rotation.copy(transform.rotation);
        this.scale.copy(transform.scale);
        //this.quaternion.copy(transform.quaternion);
    }

    update(dt: number) {
    }
}