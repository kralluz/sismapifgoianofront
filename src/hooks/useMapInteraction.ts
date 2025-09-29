import { useState, useRef } from 'react';
import type { MouseEvent } from 'react';

export interface MapInteractionState {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

export interface MapInteractionActions {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleWheel: (e: WheelEvent) => void;
  handleMouseDown: (e: MouseEvent<SVGSVGElement>) => void;
  handleMouseMove: (e: MouseEvent<SVGSVGElement>) => void;
  handleMouseUp: () => void;
  resetView: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
}

export type UseMapInteractionReturn = MapInteractionState & MapInteractionActions;

export const useMapInteraction = (isEditMode: boolean = false): UseMapInteractionReturn => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Use ref to track if we actually dragged (mouse moved after mousedown)
  const hasDraggedRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.2));

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.15;
    const newZoom = e.deltaY < 0 
      ? Math.min(zoom * zoomFactor, 5)   // Zoom in - máximo 5x
      : Math.max(zoom / zoomFactor, 0.2); // Zoom out - mínimo 0.2x
    setZoom(newZoom);
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    // Don't start dragging in edit mode unless Ctrl/Cmd is held
    if (isEditMode && !e.ctrlKey && !e.metaKey) {
      console.log('Ignoring mousedown in edit mode');
      return;
    }
    
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isDragging && (!isEditMode || e.ctrlKey || e.metaKey)) {
      // Check if we've moved enough to consider it a drag
      const deltaX = Math.abs(e.clientX - dragStartPosRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartPosRef.current.y);
      
      if (deltaX > 5 || deltaY > 5) {
        hasDraggedRef.current = true;
      }
      
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      // Small delay to ensure click events can check if we dragged
      setTimeout(() => {
        setIsDragging(false);
        hasDraggedRef.current = false;
      }, 10);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return {
    zoom,
    pan,
    isDragging: isDragging || hasDraggedRef.current,
    dragStart,
    handleZoomIn,
    handleZoomOut,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView,
    setZoom,
    setPan,
  };
};