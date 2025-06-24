import { useState, useEffect, useCallback } from 'react';
import { Typography, Tree } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { FileItem } from './FileItem';
import { FileDetailsPanel } from './FileDetailsPanel';
import styles from './FileBrowser.module.css';
import type { FileSystemEntry, DirectoryEntry, FileEntry, FileBrowserProps } from '../types';



interface TreeNode {
  title: string;
  key: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  handle: FileSystemDirectoryHandle;
}

export function FileBrowser({ currentPath = '', currentDirectory, onPathChange }: FileBrowserProps) {
  // Store the original root directory handle
  const [rootDirectory, setRootDirectory] = useState<FileSystemDirectoryHandle | null>(null);

  const [files, setFiles] = useState<FileSystemEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileSystemEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['']);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['']);
  const { Text } = Typography;

  // Recursively build the folder tree from the directory handle
  const buildTree = useCallback(async (dirHandle: FileSystemDirectoryHandle, path = ''): Promise<TreeNode> => {
    const children: TreeNode[] = [];
    for await (const handle of (dirHandle as any).values()) {
      if (handle.kind === 'directory') {
        children.push(await buildTree(handle, path ? `${path}/${handle.name}` : handle.name));
      }
    }
    return {
      title: dirHandle.name || 'root',
      key: path || '',
      children: children.length > 0 ? children : undefined,
      isLeaf: children.length === 0,
      handle: dirHandle,
    };
  }, []);

  // Set root directory only once on mount
  useEffect(() => {
    if (currentDirectory && !rootDirectory) {
      setRootDirectory(currentDirectory);
    }
  }, [currentDirectory, rootDirectory]);

  // Build the tree only from the root directory
  useEffect(() => {
    if (!rootDirectory) return;
    (async () => {
      const rootTree = await buildTree(rootDirectory, '');
      setTreeData([rootTree]);
      setExpandedKeys(['']);
    })();
  }, [rootDirectory, buildTree]);

  // Keep selectedKeys in sync with currentPath
  useEffect(() => {
    setSelectedKeys([currentPath || '']);
  }, [currentPath]);


  // Handle tree node selection (do not change root, only change right panel)
  const handleTreeSelect = useCallback((keys: React.Key[], info: any) => {
    if (info.selected && info.node) {
      const path = info.node.key as string;
      const handle = info.node.handle as FileSystemDirectoryHandle;
      onPathChange(path, handle);
      setSelectedFile(null);
      setSelectedKeys(keys as string[]);
    }
  }, [onPathChange]);

  // Handle tree expand
  const handleTreeExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys as string[]);
  };

  // Handle double click in grid (navigate into folder)
  const handleFileDoubleClick = useCallback((file: FileSystemEntry) => {
    if (file.isDirectory) {
      onPathChange(file.path, file.handle as FileSystemDirectoryHandle);
      setSelectedKeys([file.path]);
      setSelectedFile(null);
    }
  }, [onPathChange]);

  if (!currentDirectory) {
    return <div>No directory selected</div>;
  }

  const readDirectory = useCallback(async (dirHandle: FileSystemDirectoryHandle, path = ''): Promise<FileSystemEntry[]> => {
    const entries: FileSystemEntry[] = [];
    setIsLoading(true);

    try {
      // Use a type-safe approach to iterate over directory entries
      for await (const handle of (dirHandle as any).values()) {
        const filePath = path ? `${path}/${handle.name}` : handle.name;
        
        try {
          if (handle.kind === 'directory') {
            entries.push({
              name: handle.name,
              path: filePath,
              isDirectory: true,
              handle: handle as FileSystemDirectoryHandle,
            } as DirectoryEntry);
          } else {
            const fileHandle = handle as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            entries.push({
              name: handle.name,
              path: filePath,
              isDirectory: false,
              file,
              size: file.size,
              lastModified: file.lastModified,
              type: file.type,
              handle: fileHandle,
            } as FileEntry);
          }
        } catch (error) {
          console.error(`Error processing entry ${handle.name}:`, error);
        }
      }
      
      return entries.sort((a, b) => {
        // Sort directories first, then by name
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  // Helper function to navigate to a specific path
  const navigateToPath = useCallback(async (path: string) => {
    if (!currentDirectory) return;
    
    try {
      // Split the path into parts and navigate to the target directory
      const parts = path.split('/').filter(Boolean);
      let currentDir = currentDirectory;
      
      for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part);
      }
      
      // Update the path and read the new directory
      onPathChange(path, currentDir);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error navigating to path:', error);
    }
  }, [currentDirectory, onPathChange]);

  // Read directory when currentDirectory changes
  useEffect(() => {
    if (!currentDirectory || currentPath === undefined) return;
    
    const loadDirectory = async () => {
      const files = await readDirectory(currentDirectory, currentPath);
      setFiles(files);
    };
    
    loadDirectory();
  }, [currentDirectory, currentPath, readDirectory]);

  // Handle file click
  const handleFileClick = useCallback((file: FileSystemEntry) => {
    if (file.isDirectory) {
      onPathChange(file.path, file.handle as FileSystemDirectoryHandle);
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
      // TODO: Handle file preview or other actions
    }
  }, [onPathChange]);

  // Handle directory up navigation
  const handleUpDirectory = useCallback(async () => {
    if (!currentDirectory || !currentPath) return;
    
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    if (parentPath === '') {
      onPathChange('', currentDirectory);
      setSelectedFile(null);
      return;
    }
    
    try {
      const parentDir = await currentDirectory.getDirectoryHandle('..');
      onPathChange(parentPath, parentDir);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error navigating up directory:', error);
    }
  }, [currentDirectory, currentPath, onPathChange]);

  // Helper to format file size for display
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper to format last modified date for display
  const formatLastModified = (entry: FileSystemEntry): string => {
    if (entry.isDirectory) return '--';
    const fileEntry = entry as FileEntry;
    return fileEntry.lastModified 
      ? new Date(fileEntry.lastModified).toLocaleString()
      : 'Unknown';
  };

  return (
    <div className={styles.fileBrowser} style={{ background: 'var(--color-main-background)', color: 'var(--color-foreground)' }}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarTree}>
          <Tree
            treeData={treeData}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            onSelect={handleTreeSelect}
            onExpand={handleTreeExpand}
            showIcon
            icon={({ isLeaf }) => isLeaf ? <FolderOpenOutlined /> : <FolderOpenOutlined />}
            height={600}
          />
        </div>
      </div>
      <div className={styles.contentPanel}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Typography.Text type="secondary">Loading...</Typography.Text>
          </div>
        ) : (
          <div className={styles.fileGrid}>
            {files.map(file => (
              <FileItem
                key={file.path}
                entry={file}
                selected={selectedFile?.path === file.path}
                onClick={handleFileClick}
                onDoubleClick={handleFileDoubleClick}
              />
            ))}
          </div>
        )}
      </div>
      <div className={styles.fileDetails}>
        {selectedFile ? (
          <FileDetailsPanel file={selectedFile} />
        ) : (
          <div className="no-file-selected">
            <Typography.Text type="secondary">Select a file to view details</Typography.Text>
          </div>
        )}
      </div>
    </div>
  );
}
