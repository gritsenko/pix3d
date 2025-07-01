import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectState, ProjectActions, RecentProject } from './types';
import { saveHandleToIDB, getHandleFromIDB, deleteHandleFromIDB } from '../utils/idbHelper';

import { assetRegistry } from '../Core/Runtime/AssetsRegistry';
import SceneManager from '../Core/SceneManager';

interface ProjectStore extends ProjectState, ProjectActions {}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // State
      hasProjectOpen: false,
      currentDirectory: null,
      currentPath: '',
      recentProjects: [],

      // Actions
      openProject: async () => {
        try {
          const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
          }) as FileSystemDirectoryHandle;

          set({
            currentDirectory: dirHandle,
            currentPath: '',
            hasProjectOpen: true,
          });

          const idbKey = await saveHandleToIDB(dirHandle);
          const project: RecentProject = {
            name: dirHandle.name,
            idbKey: idbKey,
            lastOpened: new Date().toISOString(),
          };

          const { recentProjects } = get();
          const newProjects = [
            project,
            ...recentProjects.filter(p => p.idbKey !== project.idbKey)
          ].slice(0, 5);

          set({ recentProjects: newProjects });

          // Scan and register assets
          await scanAndRegisterAssets(dirHandle);
          await SceneManager.instance.loadAllAssets();
        } catch (error) {
          console.error('Error opening directory:', error);
          if ((error as DOMException).name !== 'AbortError') {
            throw error;
          }
        }
      },

      openRecentProject: async (project: RecentProject) => {
        try {
          const dirHandle = await getHandleFromIDB(project.idbKey);
          
          if (dirHandle) {
            const permissionStatus = await dirHandle.queryPermission({ mode: 'readwrite' });
            
            if (permissionStatus === 'granted') {
              set({
                currentDirectory: dirHandle,
                currentPath: '',
                hasProjectOpen: true,
              });
              await scanAndRegisterAssets(dirHandle);
              await SceneManager.instance.loadAllAssets();
            } else {
              // Re-prompt for permission
              const newDirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: dirHandle,
              }) as FileSystemDirectoryHandle;

              if (newDirHandle) {
                set({
                  currentDirectory: newDirHandle,
                  currentPath: '',
                  hasProjectOpen: true,
                });

                await scanAndRegisterAssets(newDirHandle);
                await SceneManager.instance.loadAllAssets();

                if (newDirHandle.name !== dirHandle.name) {
                  const updatedIdbKey = await saveHandleToIDB(newDirHandle);
                  const { recentProjects } = get();
                  const updatedProjects = recentProjects.map(p =>
                    p.idbKey === project.idbKey 
                      ? { ...p, idbKey: updatedIdbKey, name: newDirHandle.name } 
                      : p
                  );
                  set({ recentProjects: updatedProjects });
                }
              }
            }
          } else {
            // Remove broken entry
            const { recentProjects } = get();
            const updatedProjects = recentProjects.filter(p => p.idbKey !== project.idbKey);
            set({ recentProjects: updatedProjects });
            await deleteHandleFromIDB(project.idbKey);
          }
        } catch (error) {
          console.error('Error opening recent project:', error);
          const { recentProjects } = get();
          const updatedProjects = recentProjects.filter(p => p.idbKey !== project.idbKey);
          set({ recentProjects: updatedProjects });
          await deleteHandleFromIDB(project.idbKey);
        }
      },

      closeProject: () => {
        set({
          hasProjectOpen: false,
          currentDirectory: null,
          currentPath: '',
        });
      },

      setCurrentPath: (path: string, dirHandle: FileSystemDirectoryHandle) => {
        set({
          currentPath: path,
          currentDirectory: dirHandle,
        });
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({ recentProjects: state.recentProjects }),
    }
  )
);

// Utility: Recursively scan directory and register assets
const KNOWN_ASSET_TYPES = [
  { ext: ['.png', '.jpg', '.jpeg'], category: 'textures' },
  { ext: ['.glb', '.gltf'], category: 'models' },
  { ext: ['.mp3', '.wav', '.ogg'], category: 'sounds' },
  { ext: ['.json'], category: 'scenes' },
];

function getCategoryByExtension(filename: string): string | null {
  const lower = filename.toLowerCase();
  for (const type of KNOWN_ASSET_TYPES) {
    if (type.ext.some(ext => lower.endsWith(ext))) {
      return type.category;
    }
  }
  return null;
}

async function scanAndRegisterAssets(dirHandle: FileSystemDirectoryHandle, pathPrefix = ''): Promise<void> {
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file') {
      const category = getCategoryByExtension(name);
      if (category) {
        // Create a key using the relative path
        const key = pathPrefix ? `${pathPrefix}/${name}` : name;
        
        try {
          // Get the file and create a blob URL for it
          const file = await (handle as FileSystemFileHandle).getFile();
          const blobUrl = URL.createObjectURL(file);
          
          // Register with the blob URL
          assetRegistry.addAsset(category as any, key, blobUrl);
          console.log(`Registered ${category} asset: ${key} -> ${blobUrl}`);
        } catch (error) {
          console.error(`Failed to create blob URL for ${key}:`, error);
          // Fallback to the relative path (though it won't work for loading)
          assetRegistry.addAsset(category as any, key, key);
        }
      }
    } else if (handle.kind === 'directory') {
      await scanAndRegisterAssets(handle as FileSystemDirectoryHandle, pathPrefix ? `${pathPrefix}/${name}` : name);
    }
  }
}
