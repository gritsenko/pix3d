import * as THREE from 'three';
import { Behavior } from '../Behaviors/Behavior';
import { Transform } from '../Runtime';
import { GameObjectCollider } from './GameObjectCollider';
import Node3d from './Node3d';

export default class GameObject extends Node3d {
    public type: string = "GameObject";
    
    animationAction: THREE.AnimationAction | undefined;
    mixer: THREE.AnimationMixer | undefined;
    model: THREE.Object3D;
    collider: GameObjectCollider | undefined;
    animations: THREE.AnimationClip[] = [];
    currentAnimationName: string | undefined;
    modelName: string | undefined;
    private onAnimationComplete: (() => void) | undefined;

    constructor(model: THREE.Object3D, transform: Transform, Animations: THREE.AnimationClip[]) {
        super();
        this.model = model;

        this.add(this.model);
        // Ensure all meshes are visible and scale is 1
        this.traverse(obj => {
            if ((obj as THREE.Mesh).isMesh) {
                obj.visible = true;
            }
        });
        this.scale.set(1, 1, 1);

        this.mixer = new THREE.AnimationMixer(model);
        this.animations = Animations;

        this.setTransform(transform);
        console.log(this);
    }

    update(dt: number) {
        this.mixer?.update(dt);
    }

    playAnimation(animName: string, loop: THREE.AnimationActionLoopStyles = THREE.LoopRepeat, onComplete?: () => void) {
        const oldAction = this.animationAction;
        if (this.mixer == undefined)
            return;

        // Clear any existing animation complete handlers
        if (this.onAnimationComplete) {
            this.mixer.removeEventListener('finished', this.onAnimationComplete);
            this.onAnimationComplete = undefined;
        }

        this.mixer.timeScale = 1;

        const anim = this.animations.find(x => x.name.toLocaleLowerCase() == animName.toLocaleLowerCase());
        if (anim == undefined)
            return;

        oldAction?.fadeOut(0.2);

        const action = this.mixer.clipAction(anim);
        action.loop = loop;
        action.clampWhenFinished = true;
        action.play();

        oldAction?.reset();
        if (action !== oldAction)
            oldAction?.stop();

        this.animationAction = action;
        this.currentAnimationName = animName;

        // If this is a OneShot animation and we have a completion callback
        if (loop === THREE.LoopOnce && onComplete) {
            this.onAnimationComplete = () => {
                onComplete();
                // Clear the handler after it's called
                if (this.onAnimationComplete) {
                    this.mixer?.removeEventListener('finished', this.onAnimationComplete);
                    this.onAnimationComplete = undefined;
                }
            };

            // Add the event listener to the mixer
            this.mixer.addEventListener('finished', this.onAnimationComplete);
        }
    }

    setCurrentAnimationTime(time: number) {
        if (this.animationAction)
            this.animationAction.time = time;
    }

    getCurrentAnimationTime = () => this.animationAction?.time ?? 0;

    getAnimationDuration(animationName: string) {
        const anim = this.animations.find(x => x.name.toLocaleLowerCase() == animationName.toLocaleLowerCase());
        return anim?.duration ?? 0;
    }

    pauseAnimation() {
        if (this.mixer)
            this.mixer.timeScale = 0;
    }

    setCollider(collider: GameObjectCollider) {
        this.collider = collider;
        this.add(collider);
        collider.gameObject = this;
    }
    setBehaviors(behaviors: Behavior[]) {
        this.behaviors = behaviors;
        behaviors.forEach(b => b.object3d = this);
    }

    removeCollider() {
        if(this.collider)
            this.remove(this.collider);
    }

    getMeshByName(name: string) {
        const rootModel = this.model;
        return rootModel.getObjectByName(name);
    }
}

