import React, { useState } from 'react';
import type { Room, Project } from '../../types';
import { ChevronDown, ChevronRight, Folder, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '../../provider/AuthContext';

interface RoomWithProjects extends Room {
  projects?: Project[];
}

interface RoomListViewProps {
  rooms: RoomWithProjects[];
  loading: boolean;
  onRoomSelect: (room: Room) => void;
  onRoomEdit: (room: Room) => void;
  onRoomDelete: (room: Room) => void;
  onProjectCreate: (roomId: number) => void;
  onProjectEdit: (project: Project) => void;
  onProjectDelete: (project: Project) => void;
}

const RoomListView: React.FC<RoomListViewProps> = ({
  rooms,
  loading,
  onRoomSelect,
  onRoomEdit,
  onRoomDelete,
  onProjectCreate,
  onProjectEdit,
  onProjectDelete,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set());

  const toggleRoom = (roomId: number) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId);
    } else {
      newExpanded.add(roomId);
    }
    setExpandedRooms(newExpanded);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Carregando salas...</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-sm text-gray-500 mb-2">Nenhuma sala cadastrada</p>
        <p className="text-xs text-gray-400">Crie uma nova sala para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => {
        const isExpanded = expandedRooms.has(room.id);
        const projectCount = room.projects?.length || 0;

        return (
          <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Room Header */}
            <div className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRoom(room.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          onClick={() => onRoomSelect(room)}
                          className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer truncate"
                        >
                          {room.name}
                        </h3>
                        {room.path && room.path.length > 1 && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Rota definida" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{room.type}</span>
                        <span>•</span>
                        <span>{room.capacity} pessoas</span>
                        <span>•</span>
                        <span>{room.floor}º andar</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Folder className="w-3 h-3" />
                          {projectCount} {projectCount === 1 ? 'projeto' : 'projetos'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Room Actions - Apenas para Admins */}
                {isAdmin && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoomEdit(room);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Editar sala"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoomDelete(room);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Excluir sala"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Projects List */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-3 space-y-2">
                  {projectCount === 0 ? (
                    <p className="text-xs text-gray-500 italic">Nenhum projeto nesta sala</p>
                  ) : (
                    room.projects?.map((project) => (
                      <div
                        key={project.id}
                        className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-between hover:border-blue-300 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              #{project.number}
                            </span>
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {project.title}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {project.createdAt ? new Date(project.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                          </p>
                        </div>
                        
                        {/* Project Actions - Apenas para Admins */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => onProjectEdit(project)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar projeto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onProjectDelete(project)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir projeto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {/* Add Project Button - Apenas para Admins */}
                  {isAdmin && (
                    <button
                      onClick={() => onProjectCreate(room.id)}
                      className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Projeto
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoomListView;
