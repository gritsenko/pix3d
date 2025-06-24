import React from 'react';
import styles from './SceneEditor.module.css';

interface TransformToolbarProps {
  mode: 'translate' | 'rotate' | 'scale';
  onModeChange: (mode: 'translate' | 'rotate' | 'scale') => void;
}

const buttons: { mode: 'translate' | 'rotate' | 'scale'; icon: string; label: string }[] = [
  { mode: 'translate', icon: '↔', label: 'Move' },
  { mode: 'rotate', icon: '⟳', label: 'Rotate' },
  { mode: 'scale', icon: '⤢', label: 'Scale' },
];

export const TransformToolbar: React.FC<TransformToolbarProps> = ({ mode, onModeChange }) => (
  <div className={styles.toolbarOverlay}>
    {buttons.map(btn => (
      <button
        key={btn.mode}
        className={mode === btn.mode ? styles.toolbarButtonActive : styles.toolbarButton}
        onClick={() => onModeChange(btn.mode)}
        title={btn.label}
      >
        {btn.icon}
      </button>
    ))}
  </div>
);
