import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Edit3,
  Route,
  Wifi,
  WifiOff,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../provider/AuthContext';

interface MapHeaderProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  isCreatingPath: boolean;
  isPlacingUserPath: boolean;
  onToggleUserPath: () => void;
  tempPathPoints: { x: number; y: number }[];
  userPathPoints: { x: number; y: number }[];
}

const MapHeader: React.FC<MapHeaderProps> = ({
  isEditMode,
  onToggleEditMode,
  isCreatingPath,
  isPlacingUserPath,
  onToggleUserPath,
  tempPathPoints,
  userPathPoints,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isOnline = true;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-3 sm:px-4 py-3 sm:py-4 shadow-lg lg:rounded-none lg:m-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
        <div className="min-w-0">
          <h1 className="font-bold flex items-center gap-2 leading-tight text-fluid-lg sm:text-fluid-xl">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="truncate">Campus IF - Mapa Interativo</span>
            {isEditMode && (
              <span className="bg-orange-500/90 px-2 py-0.5 rounded text-[0.65rem] sm:text-xs font-semibold tracking-wide whitespace-nowrap">
                MODO EDIÇÃO
              </span>
            )}
          </h1>
          <p className="text-blue-100 text-fluid-sm sm:text-fluid-base mt-1 subtitle-clamp">
            {isEditMode
              ? isPlacingUserPath
                ? `Colocando pontos do caminho (${userPathPoints.length} pontos) - Clique no mapa para adicionar pontos. Clique nos pontos verdes para removê-los.`
                : isCreatingPath
                ? `Adicionando pontos do caminho (${tempPathPoints.length} pontos) - Clique no mapa para adicionar pontos, clique nos pontos amarelos para removê-los. Clique em uma sala para finalizar ou use o botão "Finalizar"`
                : 'Clique no mapa para adicionar locais, clique em locais para editar propriedades'
              : 'Navegação inteligente e eventos em tempo real'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            {isOnline ? 'Online' : 'Offline'}
          </div>

          {isAdmin ? (
            <>
              <button
                onClick={onToggleEditMode}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  isEditMode
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden xs:inline">{isEditMode ? 'Sair da Edição' : 'Editar Mapa'}</span>
                <span className="xs:hidden">{isEditMode ? 'Sair' : 'Editar'}</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline">Sair</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors bg-white/20 hover:bg-white/30 text-sm sm:text-base"
            >
              <User className="w-4 h-4" />
              <span className="hidden xs:inline">Login</span>
            </button>
          )}
          
          {isEditMode && (
            <button
              onClick={onToggleUserPath}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                isPlacingUserPath
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <Route className="w-4 h-4" />
              <span className="hidden xs:inline">{isPlacingUserPath ? 'Finalizar Caminho' : 'Colocar Caminho'}</span>
              <span className="xs:hidden">{isPlacingUserPath ? 'Finalizar' : 'Caminho'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapHeader;