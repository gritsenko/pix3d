import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectState, ProjectActions, RecentProject } from './types';
import { saveHandleToIDB, getHandleFromIDB, deleteHandleFromIDB } from '../utils/idbHelper';

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
