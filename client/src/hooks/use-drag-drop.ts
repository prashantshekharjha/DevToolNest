import { useState, useCallback, useRef } from 'react';

interface DragDropState {
  isDragging: boolean;
  draggedItemId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

interface UseDragDropOptions {
  onMove: (itemId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  canDrop?: (itemId: string, targetId: string, position: 'before' | 'after' | 'inside') => boolean;
}

export function useDragDrop({ onMove, canDrop }: UseDragDropOptions) {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedItemId: null,
    dropTargetId: null,
    dropPosition: null,
  });

  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
    
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedItemId: itemId,
    }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const threshold = height * 0.3;

    let position: 'before' | 'after' | 'inside';
    if (y < threshold) {
      position = 'before';
    } else if (y > height - threshold) {
      position = 'after';
    } else {
      position = 'inside';
    }

    setDragState(prev => ({
      ...prev,
      dropTargetId: targetId,
      dropPosition: position,
    }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragState(prev => ({
      ...prev,
      dropTargetId: null,
      dropPosition: null,
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    const draggedItemId = e.dataTransfer.getData('text/plain');
    if (!draggedItemId || draggedItemId === targetId) return;

    const position = dragState.dropPosition;
    if (!position) return;

    // Check if drop is allowed
    if (canDrop && !canDrop(draggedItemId, targetId, position)) {
      return;
    }

    onMove(draggedItemId, targetId, position);

    setDragState({
      isDragging: false,
      draggedItemId: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, [dragState.dropPosition, canDrop, onMove]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItemId: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  const getDropIndicatorClass = useCallback((itemId: string) => {
    if (dragState.dropTargetId !== itemId) return '';
    
    switch (dragState.dropPosition) {
      case 'before':
        return 'border-t-2 border-t-blue-500';
      case 'after':
        return 'border-b-2 border-b-blue-500';
      case 'inside':
        return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
      default:
        return '';
    }
  }, [dragState.dropTargetId, dragState.dropPosition]);

  return {
    dragState,
    dragRef,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getDropIndicatorClass,
  };
} 