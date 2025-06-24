import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import GameScene from '../../../Core/ObjectTypes/GameScene';
import SceneManager from '../../../Core/SceneManager';

export class EditMode {
    public camera: THREE.PerspectiveCamera;
    public orbitControls: OrbitControls;
    public transformControls: TransformControls;

    private renderer: THREE.WebGLRenderer;
    private scene: GameScene;
    private raycaster = new THREE.Raycaster();
    private selectionBox: THREE.Box3Helper | null = null;
    private gizmo: THREE.Object3D | null = null;

    private _selectedObject: THREE.Object3D | null = null;

    get selectedObject(): THREE.Object3D | null { return this._selectedObject; }

    private setSelectedObject(obj: THREE.Object3D | null) {
        this._selectedObject = obj;
        if (this.onSelect) {
            this.onSelect(obj);
        }
    }

    public onSelect: ((obj: THREE.Object3D | null) => void) | null = null;

    constructor(renderer: THREE.WebGLRenderer, scene: GameScene) {
        this.renderer = renderer;
        this.scene = scene;

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(10, 10, 10);

        this.orbitControls = new OrbitControls(this.camera, renderer.domElement);
        this.transformControls = new TransformControls(this.camera, renderer.domElement);
        this.transformControls.showY = true;
        this.transformControls.showX = true;
        this.transformControls.showZ = true;

        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.orbitControls.enabled = !event.value;
            if (!event.value) {
                // Dragging ended, notify transform changed for inspector update
                SceneManager.instance.emitTransform();
            }
        });

        this.transformControls.addEventListener('objectChange', () => {
            if (this.selectionBox && this.transformControls.object) {
                this.selectionBox.box.setFromObject(this.transformControls.object);
            }
        });

        this.setupEvents();
    }

    private setupEvents() {
        this.renderer.domElement.addEventListener('click', this.onObjectClick, false);
    }

    private onObjectClick = (event: MouseEvent) => {
        if (this.transformControls.dragging) return;

        const pointer = new THREE.Vector2();
        const rect = this.renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const firstIntersect = intersects[0].object;
            const rootObject = this.findRootObject(firstIntersect);
            if (rootObject.userData.isGizmo) {
                return; // Ignore clicks on the gizmo
            }
            this.selectObject(rootObject);
        } else {
            this.deselectObject();
        }
    }

    private findRootObject(object: THREE.Object3D): THREE.Object3D {
        let current = object;
        while (current.parent && current.parent.type !== 'Scene') {
            current = current.parent;
        }
        return current;
    }

    public selectObject(object: THREE.Object3D | null) {
        if (object === this._selectedObject) return;

        // Detach from previous object and remove old helpers
        this.transformControls.detach();
        if (this.selectionBox) {
            this.scene.remove(this.selectionBox);
            this.selectionBox.dispose();
            this.selectionBox = null;
        }
        if (this.gizmo) {
            this.scene.remove(this.gizmo);
            this.gizmo = null;
        }

        this.setSelectedObject(object);

        // Attach to new object and create helpers
        if (object) {
            this.transformControls.attach(object);

            // Add Gizmo to scene and tag it
            this.gizmo = this.transformControls.getHelper();
            this.gizmo.traverse((child) => {
                child.userData.isGizmo = true;
            });
            this.scene.add(this.gizmo);

            // Add Selection Box to scene and tag it
            const box = new THREE.Box3().setFromObject(object);
            this.selectionBox = new THREE.Box3Helper(box, 0x00ff00);
            this.selectionBox.userData.isGizmo = true;
            this.scene.add(this.selectionBox);
        }
    }

    public deselectObject() {
        this.selectObject(null);
    }

    public setTransformMode(mode: 'translate' | 'rotate' | 'scale') {
        this.transformControls.setMode(mode);
    }

    public update() {
        this.orbitControls.update();
    }

    public dispose() {
        this.orbitControls.dispose();
        this.transformControls.dispose();
        this.renderer.domElement.removeEventListener('click', this.onObjectClick, false);
    }

    public handleResize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    public updateSelectionBox() {
        if (this.selectionBox && this.transformControls.object) {
            this.selectionBox.box.setFromObject(this.transformControls.object);
        }
    }
}
