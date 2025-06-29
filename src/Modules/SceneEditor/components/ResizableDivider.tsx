import React from 'react';
import './ResizableDivider.css';

interface ResizableDividerProps {
  onDrag: (deltaX: number) => void;
  style?: React.CSSProperties;
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({ onDrag, style }) => {
  const dragging = React.useRef(false);
  const lastX = React.useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    const deltaX = e.clientX - lastX.current;
    lastX.current = e.clientX;
    onDrag(deltaX);
  };

  const onMouseUp = () => {
    dragging.current = false;
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      className="resizable-divider"
      style={style}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
    />
  );
};

export default ResizableDivider;
