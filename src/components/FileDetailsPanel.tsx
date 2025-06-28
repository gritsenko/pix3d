import React from 'react';
import { Button, Typography } from 'antd';
import type { FileEntry, FileSystemEntry } from '../types';
import { useEngineService } from '../contexts/ServiceProvider';
import { useSceneManager } from '../hooks/useSceneManager';
import * as THREE from 'three';

interface FileDetailsPanelProps {
  file: FileSystemEntry;
  onSelectObject?: (obj: THREE.Object3D | null) => void;
}

export const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({ file, onSelectObject }) => {
  const engineService = useEngineService();
  const { addModelToScene } = useSceneManager(engineService);
  
  const isGlb = !file.isDirectory && (file as FileEntry).name.toLowerCase().endsWith('.glb');
  
  const handleAddToScene = async () => {
    if (!isGlb) return;
    
    try {
      const fileEntry = file as FileEntry;
      const url = URL.createObjectURL(fileEntry.file);
      
      // Use the original filename as key for consistency
      const key = fileEntry.name;
      await addModelToScene(key, url);
      
      // Get the selected object through the service
      const selectedObject = engineService.getSelectedObject();
      if (onSelectObject) {
        onSelectObject(selectedObject);
      }
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Failed to add model to scene:', error);
    }
  };

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>{file.name}</Typography.Title>
      <p><Typography.Text strong>Path:</Typography.Text> {file.path}</p>
      <p><Typography.Text strong>Type:</Typography.Text> {file.isDirectory ? 'Directory' : 'File'}</p>
      {!file.isDirectory && (
        <p><Typography.Text strong>Size:</Typography.Text> {(file as FileEntry).size} bytes</p>
      )}
      {isGlb && (
        <Button type="primary" onClick={handleAddToScene} style={{ marginTop: 16 }}>
          Add to scene
        </Button>
      )}
    </div>
  );
};
