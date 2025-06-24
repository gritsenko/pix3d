import { useState, useEffect } from 'react';
// No antd imports needed anymore
import { FileBrowser } from './components/FileBrowser';
import { StartScreen } from './components/StartScreen';
import SceneEditor from './Modules/SceneEditor';
import type { RecentProject } from './types';
import { saveHandleToIDB, getHandleFromIDB, deleteHandleFromIDB } from './utils/idbHelper';
import './App.css';



function App() {
  const [hasProjectOpen, setHasProjectOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  

  const handlePathChange = (newPath: string, dirHandle: FileSystemDirectoryHandle) => {
    setCurrentPath(newPath);
    setCurrentDirectory(dirHandle);
  };

  const handleOpenProject = async () => {
    try {
      // Request permission to open a directory
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      }) as FileSystemDirectoryHandle;

      setCurrentDirectory(dirHandle);
      setCurrentPath('');
      setHasProjectOpen(true);

      // Save the FileSystemDirectoryHandle to IndexedDB
      const idbKey = await saveHandleToIDB(dirHandle);

      // Add to recent projects
      const project: RecentProject = {
        name: dirHandle.name,
        idbKey: idbKey,
        lastOpened: new Date().toISOString(),
      };
      
      setRecentProjects(prev => {
        // Ensure uniqueness by idbKey
        const newProjects = [
          project,
          ...prev.filter(p => p.idbKey !== project.idbKey)
        ].slice(0, 5); // Keep only the 5 most recent
        
        // Save to localStorage
        localStorage.setItem('recentProjects', JSON.stringify(newProjects));
        return newProjects;
      });
      
    } catch (error) {
      console.error('Error opening directory:', error);
      // Handle User Abort (e.g., if they close the picker)
      if ((error as DOMException).name === 'AbortError') {
        console.log('Directory picker aborted by user.');
      }
    }
  };

  const handleOpenRecentProject = async (project: RecentProject) => {
    try {
      // Retrieve the handle from IndexedDB
      const dirHandle = await getHandleFromIDB(project.idbKey);

      if (dirHandle) {
        // Check permission status for the retrieved handle
        const permissionStatus = await dirHandle.queryPermission({ mode: 'readwrite' });

        if (permissionStatus === 'granted') {
          // If permission is still granted, we can directly use the handle
          setCurrentDirectory(dirHandle);
          setCurrentPath('');
          setHasProjectOpen(true);
          console.log('Successfully re-opened recent project:', project.name);
        } else {
          // If permission is not granted, we need to prompt the user again
          console.warn('Permission not granted for recent project, re-prompting:', project.name);
          const newDirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: dirHandle, // Hint the picker to the previous location
          }) as FileSystemDirectoryHandle;

          if (newDirHandle) {
            // User granted permission again
            setCurrentDirectory(newDirHandle);
            setCurrentPath('');
            setHasProjectOpen(true);
            console.log('User re-granted permission and opened recent project:', project.name);

            // Update the IDB entry if the user picked a different directory
            if (newDirHandle.name !== dirHandle.name) {
              const updatedIdbKey = await saveHandleToIDB(newDirHandle);
              setRecentProjects(prev => {
                const updatedProjects = prev.map(p =>
                  p.idbKey === project.idbKey ? { ...p, idbKey: updatedIdbKey, name: newDirHandle.name } : p
                );
                localStorage.setItem('recentProjects', JSON.stringify(updatedProjects));
                return updatedProjects;
              });
            }
          } else {
            console.warn('User did not re-grant permission for recent project:', project.name);
            // If user explicitly denied, or closed the picker, remove from recent projects
            setRecentProjects(prev => {
              const updatedProjects = prev.filter(p => p.idbKey !== project.idbKey);
              localStorage.setItem('recentProjects', JSON.stringify(updatedProjects));
              return updatedProjects;
            });
            await deleteHandleFromIDB(project.idbKey); // Also remove from IndexedDB
          }
        }
      } else {
        // Handle not found in IndexedDB (e.g., IDB cleared, or a very old entry)
        console.error('Could not retrieve handle from IndexedDB for recent project:', project.name);
        // Remove this broken entry from recent projects
        setRecentProjects(prev => {
          const updatedProjects = prev.filter(p => p.idbKey !== project.idbKey);
          localStorage.setItem('recentProjects', JSON.stringify(updatedProjects));
          return updatedProjects;
        });
      }
    } catch (error) {
      console.error('Error opening recent project:', error);
      // Remove from recent if there's any other error during access
      setRecentProjects(prev => {
        const updatedProjects = prev.filter(p => p.idbKey !== project.idbKey);
        localStorage.setItem('recentProjects', JSON.stringify(updatedProjects));
        return updatedProjects;
      });
      await deleteHandleFromIDB(project.idbKey); // Also remove from IndexedDB
    }
  };

  // Load recent projects from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('recentProjects');
      if (savedProjects) {
        setRecentProjects(JSON.parse(savedProjects));
      }
    } catch (error) {
      console.error('Failed to load recent projects:', error);
      // Clear recent projects if loading fails (e.g., malformed JSON)
      localStorage.removeItem('recentProjects');
      setRecentProjects([]);
    }
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Pix3D</h1>
        {hasProjectOpen && (
          <button 
            className="back-button"
            onClick={() => {
              setHasProjectOpen(false);
              setCurrentDirectory(null);
              setCurrentPath('');
            }}
          >
            Back to Start
          </button>
        )}
      </header>
      <main className="app-content">
        {!hasProjectOpen ? (
          <StartScreen 
            onOpenProject={handleOpenProject} 
            recentProjects={recentProjects}
            onOpenRecentProject={handleOpenRecentProject}
          />
        ) : (
          <div className="editor-container">
            <div className="scene-editor-wrapper">
              <SceneEditor />
            </div>
            <div className="file-browser-wrapper">
              <FileBrowser 
                currentPath={currentPath}
                currentDirectory={currentDirectory}
                onPathChange={handlePathChange}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
