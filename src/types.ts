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
  /** legado: o backend agora exige o token de um admin no cabeçalho */
  adminEmail?: string;
  adminSenha?: string;
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

// Projetos: o local é um id do catálogo fixo (ver src/locais.ts)
export interface ProjectLocal {
  id: string;
  nome: string;
  bloco: string | null;
  tipo: string;
}

export interface Project {
  id: number;
  number: number;
  title: string;
  localId: string;
  complemento: string | null;
  local: ProjectLocal | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  number: number;
  title: string;
  localId: string;
  complemento?: string | null;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>;
