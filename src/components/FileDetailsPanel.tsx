import React from 'react';
import { Button, Typography } from 'antd';
import type { FileEntry, FileSystemEntry } from '../types';
import SceneManager from '../../src/Core/SceneManager';

interface FileDetailsPanelProps {
  file: FileSystemEntry;
}

export const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({ file }) => {
  const isGlb = !file.isDirectory && (file as FileEntry).name.toLowerCase().endsWith('.glb');
  const handleAddToScene = async () => {
    if (!isGlb) return;
    // Use file.path as key, and create a blob URL for the file
    const fileEntry = file as FileEntry;
    const url = URL.createObjectURL(fileEntry.file);
    await SceneManager.instance.AddModelToScene(fileEntry.name, url);
    // Optionally, revokeObjectURL after some time
    setTimeout(() => URL.revokeObjectURL(url), 10000);
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
