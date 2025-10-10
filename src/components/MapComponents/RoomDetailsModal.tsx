import React from 'react';
import type { Room } from '../../types';
import { X, Info, Users, Building, Hash, Edit3, Trash2 } from 'lucide-react';

interface RoomDetailsModalProps {
  room: Room;
  onClose: () => void;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
  isLoggedIn?: boolean;
}

const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({ room, onClose, onEdit, onDelete, isLoggedIn = false }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Detalhes do Ponto
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Nome */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg text-blue-900 mb-1">{room.name}</h3>
              <p className="text-sm text-blue-700">
                📍 Posição: ({room.x.toFixed(1)}, {room.y.toFixed(1)})
              </p>
            </div>
            
            {/* Informações principais */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Capacidade</p>
                  <p className="font-medium">{room.capacity}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Hash className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Andar</p>
                  <p className="font-medium">{room.floor}°</p>
                </div>
              </div>
            </div>
            
            {/* Descrição */}
            {room.description && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Descrição</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {room.description}
                </p>
              </div>
            )}
            
            {/* Tipo e Prédio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Tipo</h4>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {room.type}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Prédio</p>
                  <p className="font-medium text-sm">{room.building}</p>
                </div>
              </div>
            </div>
            
            {/* Informações do caminho */}
            {room.path && room.path.length > 1 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  🛤️ Caminho Disponível
                </h4>
                <p className="text-sm text-green-700">
                  Rota com {room.path.length} pontos de navegação
                </p>
                <div className="mt-2 text-xs text-green-600">
                  Pontos: {room.path.map((p) => `(${p[0].toFixed(0)},${p[1].toFixed(0)})`).join(' → ')}
                </div>
              </div>
            )}
            
            {/* Amenidades */}
            {room.amenities && room.amenities.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Comodidades</h4>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((amenity, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Datas */}
            {room.createdAt && (
              <div className="text-xs text-gray-500 border-t pt-3">
                <p>Criado em: {new Date(room.createdAt).toLocaleDateString('pt-BR')}</p>
                {room.updatedAt && (
                  <p>Atualizado em: {new Date(room.updatedAt).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Botões de ação */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {isLoggedIn && (onEdit || onDelete) ? (
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Fechar
                </button>
                {onEdit && (
                  <button 
                    onClick={() => {
                      onEdit(room);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir a sala "${room.name}"?`)) {
                        onDelete(room);
                        onClose();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsModal;
