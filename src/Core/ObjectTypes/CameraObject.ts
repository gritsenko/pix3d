import * as THREE from 'three';
import Node3d from './Node3d';

export default class CameraObject extends Node3d {
    public type: string = "CameraObject";

    camera: THREE.PerspectiveCamera;
    cameraHelper: THREE.CameraHelper;
    fov: number;
    aspect: number;
    near: number;
    far: number;

    constructor(
        fov: number = 50,
        aspect: number = 1.0,
        near: number = 0.1,
        far: number = 2000
    ) {
        super();
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.add(this.camera);
        this.cameraHelper = new THREE.CameraHelper(this.camera);
    }

    /**
     * Adds the camera helper to the given THREE.Scene.
     * @param scene The THREE.Scene to add the helper to.
     */
    addHelperToScene(scene: THREE.Scene) {
        scene.add(this.cameraHelper);
    }

    updateCameraParams(fov: number, aspect: number, near: number, far: number) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.camera.fov = fov;
        this.camera.aspect = aspect;
        this.camera.near = near;
        this.camera.far = far;
        this.camera.updateProjectionMatrix();
        this.cameraHelper.update();
    }
}
