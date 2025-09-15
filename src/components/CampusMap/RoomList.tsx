import React from 'react';
import type { Room } from '../../types';
import {
  Search,
  MapPin,
  ChevronDown,
  Users,
  Book,
  FlaskConical,
  Volume2,
  Utensils,
  Navigation,
} from 'lucide-react';

interface RoomListProps {
  rooms: Room[];
  selectedRoom: Room | null;
  searchTerm: string;
  filterType: string;
  onSearchChange: (term: string) => void;
  onFilterChange: (type: string) => void;
  onRoomClick: (room: Room) => void;
}

const RoomList: React.FC<RoomListProps> = ({
  rooms,
  selectedRoom,
  searchTerm,
  filterType,
  onSearchChange,
  onFilterChange,
  onRoomClick,
}) => {
  const getRoomIcon = (type: string) => {
    const icons: Record<string, any> = {
      classroom: Book,
      lab: FlaskConical,
      library: Book,
      auditorium: Volume2,
      restaurant: Utensils,
      office: Users,
    };
    return icons[type] || MapPin;
  };

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      classroom: 'Sala de Aula',
      lab: 'Laboratório',
      library: 'Biblioteca',
      auditorium: 'Auditório',
      restaurant: 'Restaurante',
      office: 'Escritório',
    };
    return labels[type] || 'Local';
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || room.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header com busca e filtros */}
      <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 text-fluid-md sm:text-fluid-lg leading-tight">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden lg:inline">Locais do Campus</span>
            <span className="lg:hidden">Locais</span>
            <span className="bg-blue-500 text-white text-[0.6rem] sm:text-xs px-2 py-1 rounded-full ml-1 sm:ml-2">
              {filteredRooms.length}
            </span>
          </h2>
        </div>

        {/* Controles de busca e filtro - Responsivos */}
        <div className="flex gap-3 lg:flex-col lg:gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar salas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
            />
          </div>

          <div className="relative lg:w-full">
            <select
              value={filterType}
              onChange={(e) => onFilterChange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm lg:w-full"
            >
              <option value="all">Todos</option>
              <option value="classroom">Salas de Aula</option>
              <option value="lab">Laboratórios</option>
              <option value="library">Biblioteca</option>
              <option value="auditorium">Auditórios</option>
              <option value="restaurant">Restaurante</option>
              <option value="office">Escritórios</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Lista de salas - Responsiva */}
      <div className="flex-1 overflow-y-auto lg:max-h-none max-h-48">
        <div className="p-2 space-y-1 lg:space-y-2">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum local encontrado</p>
              <p className="text-xs text-gray-400 mt-1">
                Tente ajustar os filtros de busca
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const Icon = getRoomIcon(room.type);
              const isSelected = selectedRoom?.id === room.id;

              return (
                <button
                  key={room.id}
                  onClick={() => onRoomClick(room)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 border group hover:shadow-md ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 shadow-md scale-105'
                      : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-semibold text-sm truncate ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}
                        >
                          {room.name}
                        </h3>
                        {isSelected && (
                          <Navigation className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                        {room.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {room.building}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isSelected
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {getRoomTypeLabel(room.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomList;