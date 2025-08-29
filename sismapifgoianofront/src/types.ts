// Tipos para o Campus Map
export type RoomType = 'classroom' | 'lab' | 'library' | 'auditorium' | 'restaurant' | 'office';

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
  capacity: number;
  type: RoomType;
  floor: number;
  building: string;
  amenities: string[];
  path?: number[][];
}

export interface Event {
  id: number;
  title: string;
  room: string;
  time: string;
  date: string;
  attendees: number;
  type: string;
  status: 'ongoing' | 'confirmed' | 'cancelled';
  speaker: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PathPoint {
  x: number;
  y: number;
  id?: string;
  label?: string;
  type?: 'entrance' | 'waypoint' | 'destination' | 'intersection';
}

export interface Path {
  id: string;
  roomId: string;
  name?: string;
  description?: string;
  points: PathPoint[];
  type: 'automatic' | 'custom' | 'user-created';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  estimatedTime?: number; // em minutos
  distance?: number; // em metros
}

export interface PathCreationState {
  isCreating: boolean;
  currentRoomId: string | null;
  tempPoints: PathPoint[];
  selectedPointIndex: number | null;
  mode: 'create' | 'edit' | 'view';
}

export interface PopoverPosition {
  top: string;
  left: string;
}

export interface CampusMapData {
  rooms: Room[];
  events: Event[];
  customPaths?: Path[];
}