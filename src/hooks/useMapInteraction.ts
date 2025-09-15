import { useState } from 'react';
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
    if (isEditMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isDragging && !isEditMode) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return {
    zoom,
    pan,
    isDragging,
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