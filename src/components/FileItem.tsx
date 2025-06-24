import React from 'react';
import classNames from 'classnames';
import { FileThumbnail } from './FileThumbnail';
import type { FileSystemEntry, FileEntry } from '../types';
import styles from './FileBrowser.module.css';

interface FileItemProps {
  entry: FileSystemEntry;
  selected: boolean;
  onClick: (entry: FileSystemEntry) => void;
  onDoubleClick: (entry: FileSystemEntry) => void;
}

export const FileItem: React.FC<FileItemProps> = ({ entry, selected, onClick, onDoubleClick }) => {
  return (
    <div
      className={classNames(styles.fileItem, { [styles.fileItemSelected]: selected })}
      tabIndex={0}
      onClick={() => onClick(entry)}
      onDoubleClick={() => onDoubleClick(entry)}
      title={entry.name}
    >
      <FileThumbnail entry={entry} size={100} />
      <div className={styles.fileItemTitle}>{entry.name}</div>
      <div className={styles.fileItemDesc}>{entry.isDirectory ? 'Folder' : formatFileSize((entry as FileEntry).size)}</div>
    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
