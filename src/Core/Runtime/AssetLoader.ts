import * as THREE from 'three';
import { decode } from 'base64-arraybuffer'
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetRegistry } from './AssetsRegistry.js';
import GameObject from '../ObjectTypes/GameObject.js';
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { Transform } from './index.js';
import { Howl } from 'howler';
import * as JSZip from 'jszip';

type ResourceEntry = { key: string, url: string };

export default class AssetLoader {

    textureLoader: THREE.TextureLoader;
    gltfLoader: GLTFLoader;
    tutorial_screen: THREE.DataTexture | undefined;
    levelJson: any;
    uiLayerJson: any;
    textures: { key: string, texture: THREE.Texture }[];
    gltfs: { key: string, gltf: GLTF }[];
    sounds: { key: string; sound: Howl; }[];

    constructor() {
        this.textures = [];
        this.gltfs = [];
        this.sounds = [];

        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new GLTFLoader();
    }

    async loadAssets() {

        const textureEntries = Object.keys(assetRegistry.getRegistry().textures).map((textureName) => ({
            key: textureName, url: assetRegistry.getRegistry().textures[textureName] as string,
        }));

        this.textures = await this.loadResoucesAsync(textureEntries, t => this.loadTextureAsync(t));

        const modelEntries = Object.keys(assetRegistry.getRegistry().models).map((modelName) => ({
            key: modelName, url: assetRegistry.getRegistry().models[modelName] as string,
        }));
        this.gltfs = await this.loadResoucesAsync(modelEntries, t => this.loadGltfAsync(t));


        this.tutorial_screen = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
        this.tutorial_screen.needsUpdate = true;

        // Load scene JSONs only if present, with error handling
        const scenes = assetRegistry.getRegistry().scenes;
        if (scenes.levelData) {
            try {
                this.levelJson = await fetch(scenes.levelData as string).then((response) => response.json());
            } catch (e) {
                console.warn('Failed to load levelData JSON:', e);
                this.levelJson = null;
            }
        } else {
            this.levelJson = null;
        }
        if (scenes.uiLayerData) {
            try {
                this.uiLayerJson = await fetch(scenes.uiLayerData as string).then((response) => response.json());
            } catch (e) {
                console.warn('Failed to load uiLayerData JSON:', e);
                this.uiLayerJson = null;
            }
        } else {
            this.uiLayerJson = null;
        }

        const soundEntries = Object.keys(assetRegistry.getRegistry().sounds).map((soundName) => ({
            key: soundName, url: assetRegistry.getRegistry().sounds[soundName] as string,
        }));
        this.sounds = await this.loadResoucesAsync(soundEntries, t => this.loadSoundAsync(t));
    }

    async loadSoundAsync(entry: ResourceEntry): Promise<{ key: string; sound: Howl; }> {
        const sound = new Howl({ src: [entry.url] });
        sound.load();
        return { key: entry.key, sound };
    }
    async loadResoucesAsync<T>(entries: ResourceEntry[], loaderFunc?: (entry: ResourceEntry) => Promise<T>) {
        const loadingPromises = entries.map((entry) => {
            return loaderFunc!(entry);
        });

        const resultPromises = await Promise.allSettled(loadingPromises);
        const result = resultPromises
            .filter(x => x.status === 'fulfilled')
            .map((x) => x.value);

        return result;
    }

    getGltfByName(name: string) {
        const gltfEntry = this.gltfs.find(x => x.key === name);
        if (!gltfEntry) {
            console.error(`GLTF model not loaded: ${name}`);
            console.log('Available models:', this.gltfs.map(x => x.key));
            return null;
        }
        return gltfEntry.gltf as GLTF;
    }

    getTextureByName(name: string): THREE.Texture {
        const texture = this.textures.find(x => x.key === name)?.texture as THREE.Texture;
        return texture;
    }

    playSoundByName(name: string) {
        const sound = this.getSoundByName(name);
        sound.play();
    }

    muteSounds() {
        Howler.stop();
        Howler.mute(true);
    }

    unmuteSounds() {
        Howler.mute(false);
    }

    getSoundByName(name: string): Howl {
        const sound = this.sounds.find(x => x.key === name)?.sound as Howl;
        return sound;
    }

    async loadTextureAsync(entry: ResourceEntry) {
        const texture = await this.textureLoader.loadAsync(entry.url);
        texture.colorSpace = THREE.SRGBColorSpace;
        return { key: entry.key, texture };
    }

    async loadGltfAsync(entry: ResourceEntry): Promise<{ key: string, gltf: GLTF }> {    
        // Handle blob URLs from File System Access API
        if (entry.url.startsWith('blob:')) {
            return this.loadGltfFromBlobUrl(entry);
        }
        
        // Original file processing (in debug mode)
        if (entry.url.startsWith('/')) {
            return this.loadGltfFromRegualarUrl(entry);
        }
        
        // Base64 data URLs
        if (entry.url.startsWith('data:')) {
            return this.loadBase64Gltf(entry);
        }
        
        // For relative paths, try to treat as regular URLs
        if (entry.url.includes('.')) {
            return this.loadGltfFromRegualarUrl(entry);
        }
        
        throw new Error(`Unsupported URL format for model ${entry.key}: ${entry.url}`);
    }

    async loadGltfFromRegualarUrl(entry: ResourceEntry) {
        const isZipped = entry.url.includes('.glb.zip');
        // Process ZIP archive
        if (isZipped) {
            const response = await fetch(entry.url);
            const zipData = await response.arrayBuffer();
            return this.extractAndParseZip(new Uint8Array(zipData), entry);
        }

        const gltf =  await this.gltfLoader.loadAsync(entry.url);
        return { key: entry.key, gltf };
    }
        
    private async extractAndParseZip(zipData: Uint8Array, entry: ResourceEntry): Promise<{ key: string, gltf: GLTF }> {
        const zip = await JSZip.loadAsync(zipData);
        
        // Find first .glb file in archive
        const glbFile = Object.values(zip.files).find(
            file => file.name.toLowerCase().endsWith('.glb')
        );
    
        if (!glbFile) {
            throw new Error('No GLB file found in ZIP archive');
        }
    
        // Extract GLB file as binary data
        const glbContent = await glbFile.async('arraybuffer');
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.parse(
                glbContent,
                "assets/models",
                gltf => resolve({ key: entry.key, gltf }),
                error => {
                    console.error('Error loading gltf:', error);
                    reject(error);
                }
            );
        });
    }

    private async loadBase64Gltf(entry: ResourceEntry) : Promise<{ key: string, gltf: GLTF }> {

        if(entry.url.startsWith('data:application/zip;base64,')) {
            return this.loadZippedGltf(entry);
        }

        // Validate that the URL is actually a base64 data URL
        if (!entry.url.startsWith("data:model/gltf-binary;base64,")) {
            throw new Error(`Invalid data URL format for model ${entry.key}. Expected base64 GLB data, got: ${entry.url.substring(0, 50)}...`);
        }

        const startIndex = "data:model/gltf-binary;base64,".length;
        const modelStr = entry.url.substring(startIndex);
        
        // Validate base64 string
        if (!modelStr || modelStr.length < 10) {
            throw new Error(`Invalid or too short base64 data for model ${entry.key}. Length: ${modelStr.length}`);
        }

        console.log(`Decoding base64 GLB for ${entry.key}, data length: ${modelStr.length}`);
        
        let mm: ArrayBuffer;
        try {
            mm = decode(modelStr);
            console.log(`Decoded ArrayBuffer size: ${mm.byteLength} bytes`);
            
            if (mm.byteLength < 20) {
                throw new Error(`Decoded GLB data too small: ${mm.byteLength} bytes`);
            }
        } catch (error) {
            console.error(`Failed to decode base64 for model ${entry.key}:`, error);
            throw new Error(`Base64 decode failed for model ${entry.key}: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.parse(
                mm,
                "assets/models",
                gltf => resolve({ key: entry.key, gltf }),
                error => {
                    console.error('Error loading gltf:', error);
                    reject(error);
                }
            );
        });
    }

    private async loadZippedGltf(entry: ResourceEntry): Promise<{ key: string, gltf: GLTF }> {
        // For base64 encoded ZIP (published mode)
        const startIndex = entry.url.indexOf('base64,') + 7;
        const zipBase64 = entry.url.substring(startIndex);
        const zipData = Uint8Array.from(atob(zipBase64), c => c.charCodeAt(0));
        return this.extractAndParseZip(zipData, entry);
    }

    loadGltfToGameObject(name: string, modelName: string, transform: Transform): GameObject | null {
        const gltf = this.getGltfByName(modelName);
        if (!gltf) {
            console.error(`Cannot create GameObject: GLTF model not loaded: ${modelName}`);
            return null;
        }
        const instance = SkeletonUtils.clone(gltf.scene);
        const animations = gltf.animations as THREE.AnimationClip[];
        const gameObject = new GameObject(instance, transform, animations);
        gameObject.name = name;
        gameObject.modelName = modelName;
        return gameObject;
    }

    async loadModel(key: string): Promise<void> {
        const modelUrl = assetRegistry.assets.models[key];
        if (!modelUrl) throw new Error('Model URL not found in registry: ' + key);
        // If already loaded, skip
        if (this.gltfs.find(x => x.key === key)) return;
        let result;
        if ((modelUrl as string).startsWith('blob:')) {
            // Handle Blob URL
            result = await this.loadGltfFromBlobUrl({ key, url: modelUrl as string });
        } else {
            result = await this.loadGltfAsync({ key, url: modelUrl as string });
        }
        this.gltfs.push(result);
    }

    private async loadGltfFromBlobUrl(entry: ResourceEntry): Promise<{ key: string, gltf: GLTF }> {
        const response = await fetch(entry.url);
        const arrayBuffer = await response.arrayBuffer();
        return new Promise((resolve, reject) => {
            this.gltfLoader.parse(
                arrayBuffer,
                '',
                gltf => resolve({ key: entry.key, gltf }),
                error => {
                    console.error('Error loading gltf from blob:', error);
                    reject(error);
                }
            );
        });
    }
}