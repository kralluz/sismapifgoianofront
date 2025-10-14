import React from 'react';
import type { Room, Project } from '../../types';
import {
  X,
  MapPin,
  Users,
  Building2,
  Layers,
  Route,
  Folder,
  Calendar,
  Hash,
} from 'lucide-react';

interface RoomWithProjects extends Room {
  projects?: Project[];
}

interface RoomDetailsFullModalProps {
  room: RoomWithProjects;
  onClose: () => void;
}

const RoomDetailsFullModal: React.FC<RoomDetailsFullModalProps> = ({ room, onClose }) => {
  const projectCount = room.projects?.length || 0;

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      classroom: 'Sala de Aula',
      lab: 'Laboratório',
      library: 'Biblioteca',
      auditorium: 'Auditório',
      restaurant: 'Restaurante',
      office: 'Escritório',
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{room.name}</h2>
              <p className="text-purple-100 text-sm mt-1">{room.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informações Gerais da Sala */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Informações da Sala
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Tipo</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {getRoomTypeLabel(room.type)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Capacidade</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {room.capacity} pessoas
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Andar</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {room.floor}º Andar
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-orange-700 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Prédio</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {room.building}
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
                <div className="flex items-center gap-2 text-teal-700 mb-1">
                  <Route className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Rota</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {room.path && room.path.length > 1 ? (
                    <span className="text-green-600">✓ Definida</span>
                  ) : (
                    <span className="text-gray-400">Não definida</span>
                  )}
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                <div className="flex items-center gap-2 text-pink-700 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Posição</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  X: {room.x.toFixed(2)}, Y: {room.y.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Amenidades */}
          {room.amenities && room.amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Recursos e Amenidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Projetos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Folder className="w-5 h-5 text-purple-600" />
                Projetos Vinculados
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                  {projectCount}
                </span>
              </h3>
            </div>

            {projectCount === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Folder className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-1">Nenhum projeto vinculado</p>
                <p className="text-xs text-gray-400">
                  Esta sala ainda não possui projetos cadastrados
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {room.projects?.map((project, index) => (
                  <div
                    key={project.id}
                    className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-lg font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              <Hash className="w-3 h-3 mr-1" />
                              {project.number}
                            </span>
                            <h4 className="font-semibold text-gray-900">
                              {project.title}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informações adicionais do projeto */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-200">
                      {project.createdAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Criado em:{' '}
                            {new Date(project.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {project.updatedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Atualizado em:{' '}
                            {new Date(project.updatedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-medium">ID da Sala:</span> {room.id}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsFullModal;
