import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { MapPin, Users, LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '../provider/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8" />
              <h1 className="text-xl font-bold">SisMap IF</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') || isActive('/mapa')
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Mapa
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/usuarios"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/usuarios')
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Usuários
                </Link>
              )}
            </nav>

            {/* User Info & Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/90">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  {user?.nome}
                  {user?.role === 'admin' && (
                    <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                      Admin
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/20">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/') || isActive('/mapa')
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Mapa
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/usuarios"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/usuarios')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Usuários
                  </Link>
                )}

                <div className="border-t border-white/20 pt-2">
                  <div className="px-3 py-2 text-white/90 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user?.nome}
                      {user?.role === 'admin' && (
                        <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
