import React, { useState } from 'react';
import type { Room, Project, CreateProjectRequest } from '../../types';
import { X, Info, Users, Building, Hash, Edit3, Trash2, Calendar, Plus, Edit, Trash, FolderOpen } from 'lucide-react';

interface RoomWithProjects extends Room {
  projects?: Project[];
}

interface RoomDetailsModalProps {
  room: RoomWithProjects;
  onClose: () => void;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
  onProjectCreate?: (projectData: CreateProjectRequest) => Promise<void>;
  onProjectEdit?: (project: Project) => void;
  onProjectDelete?: (project: Project) => void;
  isLoggedIn?: boolean;
}

const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({ 
  room, 
  onClose, 
  onEdit, 
  onDelete, 
  onProjectCreate,
  onProjectEdit,
  onProjectDelete,
  isLoggedIn = false 
}) => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectNumber, setProjectNumber] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectNumber || !projectTitle.trim()) {
      setFormError('Preencha todos os campos');
      return;
    }

    if (!onProjectCreate) return;

    try {
      setIsSubmitting(true);
      setFormError(null);
      
      await onProjectCreate({
        number: Number(projectNumber),
        title: projectTitle.trim(),
        roomId: room.id,
      });

      // Limpar formulário e fechar
      setProjectNumber('');
      setProjectTitle('');
      setShowProjectForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelProjectForm = () => {
    setShowProjectForm(false);
    setProjectNumber('');
    setProjectTitle('');
    setFormError(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Detalhes do Ponto
            </h2>
            <div className="flex items-center gap-2">
              {isLoggedIn && onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja excluir a sala "${room.name}"?`)) {
                      onDelete(room);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
                  title="Apagar sala"
                >
                  <Trash2 className="w-4 h-4" />
                  Apagar
                </button>
              )}
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
            
            {/* Projetos da Sala */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-purple-600" />
                  Projetos ({room.projects?.length || 0})
                </h4>
                {isLoggedIn && onProjectCreate && !showProjectForm && (
                  <button
                    onClick={() => setShowProjectForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo Projeto
                  </button>
                )}
              </div>

              {/* Formulário de Criação de Projeto */}
              {showProjectForm && (
                <form onSubmit={handleProjectSubmit} className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h5 className="font-medium text-purple-900 mb-3 text-sm">Adicionar Novo Projeto</h5>
                  
                  {formError && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Número do Projeto *
                      </label>
                      <input
                        type="number"
                        value={projectNumber}
                        onChange={(e) => setProjectNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: 1, 2, 3..."
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Título do Projeto *
                      </label>
                      <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Digite o título do projeto"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        {isSubmitting ? 'Criando...' : 'Criar Projeto'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelProjectForm}
                        disabled={isSubmitting}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors font-medium text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Lista de Projetos */}
              {room.projects && room.projects.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {room.projects.map((project) => (
                    <div
                      key={project.id}
                      className="group p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-600 text-white">
                              #{project.number}
                            </span>
                            {project.createdAt && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                          <h5 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {project.title}
                          </h5>
                        </div>

                        {/* Botões de Ação */}
                        {isLoggedIn && (onProjectEdit || onProjectDelete) && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onProjectEdit && (
                              <button
                                onClick={() => onProjectEdit(project)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="Editar projeto"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onProjectDelete && (
                              <button
                                onClick={() => onProjectDelete(project)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Excluir projeto"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Nenhum projeto cadastrado</p>
                  {isLoggedIn && onProjectCreate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Clique em "Novo Projeto" para adicionar
                    </p>
                  )}
                </div>
              )}
            </div>

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
