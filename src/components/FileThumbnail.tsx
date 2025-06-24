import React, { useEffect, useState } from 'react';
import { FileOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { FileEntry, FileSystemEntry } from '../types';

interface FileThumbnailProps {
  entry: FileSystemEntry;
  size?: number;
}

const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const FileThumbnail: React.FC<FileThumbnailProps> = ({ entry, size = 32 }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (!entry.isDirectory && imageTypes.includes((entry as FileEntry).type)) {
      const file = (entry as FileEntry).file;
      url = URL.createObjectURL(file);
      setThumbUrl(url);
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } else {
      setThumbUrl(null);
    }
    // Cleanup
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [entry]);

  const boxStyle = { width: 100, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-panels-background)', borderRadius: 4, margin: 0 };

  if (entry.isDirectory) {
    return (
      <div style={boxStyle}>
        <FolderOpenOutlined style={{ fontSize: size * 0.6, color: 'var(--color-foreground)', opacity: 0.7 }} />
      </div>
    );
  }
  if (thumbUrl) {
    return (
      <div style={boxStyle}>
        <img
          src={thumbUrl}
          alt={entry.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4, margin: 0, display: 'block', background: 'var(--color-panels-background)' }}
        />
      </div>
    );
  }
  return (
    <div style={boxStyle}>
      <FileOutlined style={{ fontSize: size * 0.6, color: 'var(--color-foreground)', opacity: 0.7 }} />
    </div>
  );
};
