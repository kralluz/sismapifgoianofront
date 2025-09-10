import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType, AuthResponse, RegisterRequest } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há token salvo no localStorage ao inicializar
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('authUser');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Limpar dados corrompidos
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, senha: string): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.login({ email, senha });
      
      // Salvar dados no localStorage
      localStorage.setItem('authToken', 'user-logged-in'); // Token simulado
      localStorage.setItem('authUser', JSON.stringify(response));
      
      setUser(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);
      
      // Após registro bem-sucedido, fazer login automaticamente
      localStorage.setItem('authToken', 'user-logged-in'); // Token simulado
      localStorage.setItem('authUser', JSON.stringify(response));
      
      setUser(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Manter o token de admin se existir
    // localStorage.removeItem('adminToken'); // Não remover token admin
    // localStorage.removeItem('adminUser'); // Não remover dados admin
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
