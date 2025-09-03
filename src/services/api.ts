const API_BASE_URL = 'https://api-sismap-api.i5mfns.easypanel.host';

export const api = {
  // Login
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Erro ao fazer login');
    return response.json();
  },

  // Logout
  logout: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Erro ao fazer logout');
    return response.json();
  },
  // Buscar todas as salas/locais
  getRooms: async () => {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    if (!response.ok) throw new Error('Erro ao buscar salas');
    return response.json();
  },

  // Buscar sala específica
  getRoom: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar sala');
    return response.json();
  },

  // Criar nova sala
  createRoom: async (roomData: any) => {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData)
    });
    if (!response.ok) throw new Error('Erro ao criar sala');
    return response.json();
  },

  // Atualizar sala
  updateRoom: async (id: string, roomData: any) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData)
    });
    if (!response.ok) throw new Error('Erro ao atualizar sala');
    return response.json();
  },

  // Deletar sala
  deleteRoom: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao deletar sala');
    return response.json();
  },

  // Buscar eventos
  getEvents: async () => {
    const response = await fetch(`${API_BASE_URL}/events`);
    if (!response.ok) throw new Error('Erro ao buscar eventos');
    return response.json();
  }
};

export default api;