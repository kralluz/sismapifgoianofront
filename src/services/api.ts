import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api-sismap-api.i5mfns.easypanel.host";

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

// Lança um Error com a mensagem que a API mandou (ex.: número repetido)
const ensureOk = async (response: Response, fallback: string) => {
  if (response.ok) return;
  let message = fallback;
  try {
    const body = await response.json();
    if (body?.error) message = body.error;
  } catch {
    // resposta sem JSON: mantém a mensagem padrão
  }
  if (response.status === 401 || response.status === 403) {
    message = response.status === 401 ? "Faça login para continuar." : message;
  }
  throw new Error(message);
};

export const authAPI = {
  login: async (loginData: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });
    if (response.status === 401) throw new Error("Credenciais inválidas");
    await ensureOk(response, "Erro ao fazer login");
    return response.json();
  },

  // Fora o primeiro acesso, só um admin logado pode criar contas
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    await ensureOk(response, "Erro ao registrar usuário");
    return response.json();
  },
};

export const api = {
  getProjects: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE_URL}/api/project`);
    await ensureOk(response, "Erro ao buscar projetos");
    return response.json();
  },

  createProject: async (projectData: CreateProjectRequest): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/api/project`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    await ensureOk(response, "Erro ao criar projeto");
    return response.json();
  },

  updateProject: async (id: number, projectData: UpdateProjectRequest): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/api/project/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    await ensureOk(response, "Erro ao atualizar projeto");
    return response.json();
  },

  deleteProject: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/project/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    await ensureOk(response, "Erro ao excluir projeto");
  },
};

export default api;
