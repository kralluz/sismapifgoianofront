// Tipos para o Campus Map
export type RoomType = 'classroom' | 'lab' | 'library' | 'auditorium' | 'restaurant' | 'office';

export interface Room {
  id: number;
  name: string;
  x: number;
  y: number;
  description: string;
  capacity: number;
  type: string;
  floor: number;
  building: string;
  amenities: string[];
  path?: number[][];
  createdAt?: string;
  updatedAt?: string;
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
  roomId: number;
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

// Tipos para autenticação
export interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  role: string;
  adminEmail: string;
  adminSenha: string;
}

export interface AuthResponse {
  id: number;
  nome: string;
  email: string;
  role: string;
  token: string;
  isFirstLogin?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

// Tipos para Rooms
export interface CreateRoomRequest {
  name: string;        // obrigatório (2-100 chars)
  x: number;          // obrigatório
  y: number;          // obrigatório
  description: string; // obrigatório (max 500 chars)
  path?: number[][];   // opcional (array de pontos [x,y])
}

export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {}

export interface RoomContextType {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  fetchRoom: (id: number) => Promise<Room>;
  createRoom: (roomData: CreateRoomRequest) => Promise<Room>;
  updateRoom: (id: number, roomData: UpdateRoomRequest) => Promise<Room>;
  deleteRoom: (id: number) => Promise<void>;
  clearError: () => void;
  setCurrentRoom: (room: Room | null) => void;
}

// Tipos para Projects
export interface Project {
  id: number;
  number: number;
  title: string;
  roomId: number;
  room?: Room; // Objeto completo da sala (retornado pela API)
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  number: number;
  title: string;
  roomId: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<Project>;
  createProject: (projectData: CreateProjectRequest) => Promise<Project>;
  updateProject: (id: number, projectData: UpdateProjectRequest) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  clearError: () => void;
  setCurrentProject: (project: Project | null) => void;
}