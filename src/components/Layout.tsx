import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Users,
  LogOut,
  User,
  Settings,
  Home
} from 'lucide-react';
import { useAuth } from '../provider/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      path: '/',
      icon: Home,
      label: 'Mapa',
      description: 'Visualizar mapa interativo'
    },
    ...(user?.role === 'admin' ? [{
      path: '/usuarios',
      icon: Users,
      label: 'Usuários',
      description: 'Gerenciar usuários do sistema'
    }] : [])
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Header Mobile Compacto - FIXO */}
      {/* Mobile top brand bar removido para maximizar área do mapa */}

      {/* Sidebar Mobile removida: navegação apenas via bottom bar em mobile */}

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <div className="flex-1 lg:pt-0 pt-0 lg:pb-0 w-full overflow-hidden">
          <Outlet />
        </div>
      </main>

      {/* Menu Inferior Mobile - Estilo Google Maps */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="grid grid-cols-3 gap-1 p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path) || (item.path === '/' && isActive('/mapa'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium ${active ? 'text-blue-700' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                {active && (
                  <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>
                )}
              </Link>
            );
          })}
          
          {/* Botão de Menu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsUserMenuOpen(!isUserMenuOpen);
            }}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 relative ${
              isUserMenuOpen
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-medium">Perfil</span>
            
            {/* Menu do usuário do bottom menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="font-medium text-gray-900 text-sm">{user?.nome || 'Usuário'}</div>
                  <div className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
                
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Layout;
