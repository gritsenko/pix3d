import React from 'react';
import { Button, Typography } from 'antd';
import type { FileEntry, FileSystemEntry } from '../types';
import SceneManager from '../Core/SceneManager';
import * as THREE from 'three';


interface FileDetailsPanelProps {
  file: FileSystemEntry;
  onSelectObject?: (obj: THREE.Object3D | null) => void;
}


export const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({ file, onSelectObject }) => {
  const isGlb = !file.isDirectory && (file as FileEntry).name.toLowerCase().endsWith('.glb');
  const isJson = !file.isDirectory && (file as FileEntry).name.toLowerCase().endsWith('.json');

  const handleAddToScene = async () => {
    if (!isGlb) return;
    try {
      const fileEntry = file as FileEntry;
      const url = URL.createObjectURL(fileEntry.file);
      const key = fileEntry.name;
      await SceneManager.instance.AddModelToScene(key, url);
      const selectedObject = SceneManager.instance.selected;
      if (onSelectObject) {
        onSelectObject(selectedObject);
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Failed to add model to scene:', error);
    }
  };

  const handleLoadScene = async () => {
    if (!isJson) return;
    try {
      const fileEntry = file as FileEntry;
      const text = await fileEntry.file.text();
      const json = JSON.parse(text);
      await SceneManager.instance.loadSceneFromJson(json);
    } catch (error) {
      console.error('Failed to load scene from JSON:', error);
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
      {isJson && (
        <Button type="primary" onClick={handleLoadScene} style={{ marginTop: 16, marginLeft: 8 }}>
          LoadScene
        </Button>
      )}
    </div>
  );
};
