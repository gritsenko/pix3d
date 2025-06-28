import { FileBrowser } from './components/FileBrowser';
import { StartScreen } from './components/StartScreen';
import SceneEditor from './Modules/SceneEditor';
import { ServiceProvider } from './contexts/ServiceProvider';
import { useProjectStore } from './stores/projectStore';
import './App.css';

function AppContent() {
  const {
    hasProjectOpen,
    currentDirectory,
    currentPath,
    recentProjects,
    openProject,
    openRecentProject,
    closeProject,
    setCurrentPath,
  } = useProjectStore();

  const handlePathChange = (newPath: string, dirHandle: FileSystemDirectoryHandle) => {
    setCurrentPath(newPath, dirHandle);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Pix3D</h1>
        {hasProjectOpen && (
          <button 
            className="back-button"
            onClick={closeProject}
          >
            Back to Start
          </button>
        )}
      </header>
      <main className="app-content">
        {!hasProjectOpen ? (
          <StartScreen 
            onOpenProject={openProject} 
            recentProjects={recentProjects}
            onOpenRecentProject={openRecentProject}
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

function App() {
  return (
    <ServiceProvider>
      <AppContent />
    </ServiceProvider>
  );
}

export default App;
