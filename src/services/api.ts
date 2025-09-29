import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Room,
  CreateRoomRequest,
  UpdateRoomRequest,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "../types";

const API_BASE_URL = "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const getAuthHeadersNoContentType = () => {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const authAPI = {
  login: async (loginData: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Credenciais inválidas");
      }
      throw new Error("Erro ao fazer login");
    }

    return response.json();
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error("Email já cadastrado ou dados inválidos");
      }
      if (response.status === 403) {
        throw new Error("Apenas administradores podem criar contas");
      }
      throw new Error("Erro ao registrar usuário");
    }

    return response.json();
  },


};

export const api = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha: password }),
    });
    if (!response.ok) throw new Error("Erro ao fazer login");
    return response.json();
  },

  register: async (userData: {
    nome: string;
    email: string;
    senha: string;
    role: string;
    adminEmail: string;
    adminSenha: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error("Erro ao registrar usuário");
    return response.json();
  },

  getRooms: async (): Promise<Room[]> => {
    const response = await fetch(`${API_BASE_URL}/api/room`, {
      headers: getAuthHeadersNoContentType(),
    });
    if (!response.ok) throw new Error("Erro ao buscar salas");
    return response.json();
  },

  getRoom: async (id: string): Promise<Room> => {
    const response = await fetch(`${API_BASE_URL}/api/room/${id}`, {
      headers: getAuthHeadersNoContentType(),
    });
    if (!response.ok) throw new Error("Erro ao buscar sala");
    return response.json();
  },

  createRoom: async (roomData: CreateRoomRequest): Promise<Room> => {
    try {
      console.log('Sending room data to API:', roomData);
      const response = await fetch(`${API_BASE_URL}/api/room`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(roomData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', response.status, errorData);
        
        if (response.status === 401) {
          throw new Error("Não autorizado. Faça login novamente.");
        } else if (response.status === 400) {
          try {
            const jsonError = JSON.parse(errorData);
            throw new Error(jsonError.error || "Dados inválidos");
          } catch {
            throw new Error("Dados inválidos fornecidos");
          }
        } else if (response.status === 500) {
          throw new Error("Erro interno do servidor. Tente novamente.");
        }
        
        throw new Error(`Erro ${response.status}: ${errorData || 'Erro ao criar sala'}`);
      }
      
      const result = await response.json();
      console.log('Room created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in createRoom:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro ao criar sala");
    }
  },

  updateRoom: async (id: string, roomData: UpdateRoomRequest): Promise<Room> => {
    const response = await fetch(`${API_BASE_URL}/api/room/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData),
    });
    if (!response.ok) throw new Error("Erro ao atualizar sala");
    return response.json();
  },

  deleteRoom: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/room/${id}`, {
      method: "DELETE",
      headers: getAuthHeadersNoContentType(),
    });
    if (!response.ok) throw new Error("Erro ao deletar sala");
    // 204 No Content
    if (response.status === 204) return;
    try {
      return await response.json();
    } catch {
      return;
    }
  },

  getProjects: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE_URL}/api/project`, {
      headers: getAuthHeadersNoContentType(),
    });
    if (!response.ok) throw new Error("Erro ao buscar projetos");
    return response.json();
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/api/project/${id}`, {
      headers: getAuthHeadersNoContentType(),
    });
    if (!response.ok) throw new Error("Erro ao buscar projeto");
    return response.json();
  },

  createProject: async (projectData: CreateProjectRequest): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/api/project`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    if (!response.ok) throw new Error("Erro ao criar projeto");
    return response.json();
  },

  updateProject: async (id: string, projectData: UpdateProjectRequest): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/api/project/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    if (!response.ok) throw new Error("Erro ao atualizar projeto");
    return response.json();
  },

  deleteProject: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/project/${id}`, {
      method: "DELETE",
      headers: getAuthHeadersNoContentType(),
    });
    if (!response.ok) throw new Error("Erro ao deletar projeto");
    if (response.status === 204) return;
    try {
      return await response.json();
    } catch {
      return;
    }
  },

  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error("Erro ao verificar saúde da API");
    return response.json();
  },
};

export const userAPI = {
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "Acesso negado. Apenas administradores podem listar usuários"
        );
      }
      throw new Error("Erro ao buscar usuários");
    }

    return response.json();
  },

  createUser: async (userData: RegisterRequest) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error("Email já cadastrado ou dados inválidos");
      }
      if (response.status === 403) {
        throw new Error("Apenas administradores podem criar usuários");
      }
      throw new Error("Erro ao criar usuário");
    }

    return response.json();
  },

  updateUser: async (userId: number, userData: Partial<RegisterRequest>) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Acesso negado");
      }
      if (response.status === 404) {
        throw new Error("Usuário não encontrado");
      }
      throw new Error("Erro ao atualizar usuário");
    }

    return response.json();
  },

  deleteUser: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Acesso negado");
      }
      if (response.status === 404) {
        throw new Error("Usuário não encontrado");
      }
      throw new Error("Erro ao deletar usuário");
    }

    return response.json();
  },

  getUser: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Usuário não encontrado");
      }
      throw new Error("Erro ao buscar usuário");
    }

    return response.json();
  },
};

export default api;
