// AssetRegistry.ts
import { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { Howl } from 'howler';
import * as THREE from 'three'; // Для THREE.Texture

// Определяем типы для категорий ассетов
interface AssetCategories {
    textures: { [key: string]: string | THREE.Texture }; // Изначально URL, после загрузки THREE.Texture
    models: { [key: string]: string | GLTF };         // Изначально URL, после загрузки GLTF
    sounds: { [key: string]: string | Howl };         // Изначально URL, после загрузки Howl
    scenes: { [key: string]: string | any };          // Изначально URL, после загрузки JSON
    [key: string]: { [key: string]: string | any };   // Для других динамических категорий
}

class AssetRegistry {
    private static instance: AssetRegistry;

    // Внутренние хранилища для ассетов.
    // Обратите внимание: здесь мы будем хранить как URL, так и загруженные объекты.
    // AssetLoader будет использовать эти URL, а затем при необходимости обновлять их
    // на загруженные объекты, если мы захотим кэшировать их здесь.
    // Пока что, для сохранения логики AssetLoader, мы будем хранить только URL.
    // Загруженные объекты будут храниться непосредственно в AssetLoader.
    public assets: AssetCategories = {
        textures: {},
        models: {},
        sounds: {},
        scenes: {},
    };

    private constructor() {
        // Приватный конструктор для реализации синглтона
    }

    public static getInstance(): AssetRegistry {
        if (!AssetRegistry.instance) {
            AssetRegistry.instance = new AssetRegistry();
        }
        return AssetRegistry.instance;
    }

    /**
     * Добавляет или обновляет ресурс в реестре.
     * @param category Категория ресурса (e.g., 'textures', 'models', 'sounds', 'scenes').
     * @param key Уникальный ключ ресурса (e.g., 'logo_png', 'robot_glb').
     * @param url URL ресурса (может быть data URI).
     */
    public addAsset(category: keyof AssetCategories, key: string, url: string): void {
        if (!this.assets[category]) {
            this.assets[category] = {};
        }
        (this.assets[category] as { [key: string]: string })[key] = url;
        console.log(`Added asset: Category: ${category}, Key: ${key}, URL: ${url}`);
    }

    /**
     * Удаляет ресурс из реестра.
     * @param category Категория ресурса.
     * @param key Ключ ресурса.
     */
    public removeAsset(category: keyof AssetCategories, key: string): void {
        if (this.assets[category] && (this.assets[category] as { [key: string]: string })[key]) {
            delete (this.assets[category] as { [key: string]: string })[key];
            console.log(`Removed asset: Category: ${category}, Key: ${key}`);
        } else {
            console.warn(`Asset not found for removal: Category: ${category}, Key: ${key}`);
        }
    }

    /**
     * Очищает всю категорию ассетов.
     * @param category Категория для очистки.
     */
    public clearCategory(category: keyof AssetCategories): void {
        if (this.assets[category]) {
            this.assets[category] = {};
            console.log(`Cleared category: ${category}`);
        } else {
            console.warn(`Category not found for clearing: ${category}`);
        }
    }

    /**
     * Возвращает текущий реестр ассетов.
     * Этот метод будет использоваться AssetLoader.
     */
    public getRegistry(): AssetCategories {
        return this.assets;
    }
}

// Экспортируем единственный экземпляр реестра ассетов
export const assetRegistry = AssetRegistry.getInstance();

// Пример начального заполнения реестра (как ваш старый assets.js)
// Это можно удалить или модифицировать в вашем редакторе, если все ассеты загружаются динамически.
/*
assetRegistry.addAsset('textures', 'logo_png', './assets/textures/logo.png?url');
assetRegistry.addAsset('textures', 'play_png', './assets/textures/PLAY.png?url');
assetRegistry.addAsset('models', 'scene_glb', './assets/models/Scene.glb?url');
assetRegistry.addAsset('models', 'robot_glb', './assets/models/Robot.glb.zip?url');
assetRegistry.addAsset('sounds', 'music_sound', './assets/sounds/music.mp3?url');
assetRegistry.addAsset('scenes', 'levelData', './assets/scenes/level.json?url');
assetRegistry.addAsset('scenes', 'uiLayerData', './assets/scenes/ui.json?url');
*/