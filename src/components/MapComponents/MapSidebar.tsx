import React, { useState, useMemo } from 'react';
import { Search, Calendar, MapPin, ChevronRight, X, Plus, Edit, Trash2 } from 'lucide-react';
import type { Room, Project } from '../../types';
import CreateRoomForm from './CreateRoomForm';
import EditRoomForm from './EditRoomForm';
import ProjectForm from '../SimpleMap/ProjectForm';
import { useAuth } from '../../provider/AuthContext';

interface RoomWithProjects extends Room {
  projects?: Project[];
}

interface MapSidebarProps {
  rooms: RoomWithProjects[];
  loading: boolean;
  sidebarMinimized: boolean;
  setSidebarMinimized: (value: boolean) => void;
  onRoomSelect: (room: Room) => void;
  onProjectSelect?: (projectId: number | null, room: Room | null) => void;
  onRoomEdit: (room: Room) => void;
  onRoomDelete: (room: Room) => void;
  onProjectCreate: (roomId: number) => void;
  onProjectEdit: (project: Project) => void;
  onProjectDelete: (project: Project) => void;
  onProjectCreateSubmit?: (projectData: {
    number: number;
    title: string;
    roomId: number;
  }) => Promise<void>;
  // Props para o wizard
  isTracingPath: boolean;
  onStartTracing: () => void;
  onStopTracing: () => void;
  tracedPath: Array<[number, number]>;
  roomPosition: { x: number; y: number } | null;
  onCreateRoom: (data: any, path: Array<[number, number]>, position: { x: number; y: number }) => Promise<void>;
  // Props para edição de sala
  showEditRoomForm?: boolean;
  roomToEdit?: Room | null;
  onUpdateRoom?: (id: number, data: any, path: Array<[number, number]>, position: { x: number; y: number }) => Promise<void>;
  onCancelEditRoom?: () => void;
}

const MapSidebar: React.FC<MapSidebarProps> = ({
  rooms,
  loading,
  sidebarMinimized,
  setSidebarMinimized,
  onRoomSelect,
  onProjectSelect,
  onRoomEdit,
  onRoomDelete,
  onProjectEdit,
  onProjectDelete,
  onProjectCreateSubmit,
  isTracingPath,
  onStartTracing,
  onStopTracing,
  tracedPath,
  roomPosition,
  onCreateRoom,
  showEditRoomForm = false,
  roomToEdit,
  onUpdateRoom,
  onCancelEditRoom,
}) => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'projetos' | 'salas'>('projetos');

  // Flatten all projects from rooms
  const allProjects = useMemo(() => {
    const projects: Array<Project & { room: Room }> = [];
    rooms.forEach(room => {
      if (room.projects) {
        room.projects.forEach(project => {
          projects.push({ ...project, room });
        });
      }
    });
    return projects;
  }, [rooms]);

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return allProjects;
    
    const query = searchQuery.toLowerCase();
    return allProjects.filter(project => 
      project.title.toLowerCase().includes(query) ||
      `#${project.number}`.toLowerCase().includes(query) ||
      project.room.name.toLowerCase().includes(query)
    );
  }, [allProjects, searchQuery]);

  // Filter rooms based on search
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    
    const query = searchQuery.toLowerCase();
    return rooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.description.toLowerCase().includes(query)
    );
  }, [rooms, searchQuery]);

  const totalProjects = allProjects.length;

  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [detailedProject, setDetailedProject] = useState<(Project & { room: Room }) | null>(null);

  const handleProjectClick = (project: Project & { room: Room }) => {
    // Se clicar no projeto já selecionado, desmarcar
    if (selectedProject?.id === project.id) {
      setSelectedProject(null);
      if (onProjectSelect) {
        onProjectSelect(null, null);
      }
    } else {
      setSelectedProject(project);
      // Notifica o componente pai sobre a seleção do projeto
      if (onProjectSelect) {
        onProjectSelect(project.id, project.room);
      }
      // Mostrar detalhes do projeto
      setDetailedProject(project);
      setShowProjectDetails(true);
    }
  };

  const handleBackFromDetails = () => {
    setShowProjectDetails(false);
    setDetailedProject(null);
  };

  if (sidebarMinimized) {
    return (
      <button
        onClick={() => setSidebarMinimized(false)}
        className="absolute left-0 top-4 z-20 bg-white shadow-lg border border-gray-200 rounded-r-lg p-3 hover:bg-gray-50 transition-all hover:pr-4 group"
        title="Expandir menu"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
      </button>
    );
  }

  return (
    <div className="relative bg-white shadow-2xl flex flex-col flex-shrink-0 z-20 w-80 lg:w-96 border-r border-gray-100 transition-all duration-300 ease-in-out animate-in slide-in-from-left h-screen">
      {/* Modern Header */}
      <div className="p-6 border-b border-gray-100 animate-in fade-in slide-in-from-top duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-2xl font-bold text-gray-900">Mapa IF- Campus Ceres</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeTab === 'projetos' ? `${totalProjects} projetos` : `${rooms.length} salas`}
            </p>
          </div>
          <button
            onClick={() => setSidebarMinimized(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            title="Minimizar"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Tabs */}
        {!showCreateWizard && (
          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('projetos');
                setSearchQuery('');
                setSelectedProject(null);
                if (onProjectSelect) onProjectSelect(null, null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'projetos'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Projetos
            </button>
            <button
              onClick={() => {
                setActiveTab('salas');
                setSearchQuery('');
                setSelectedProject(null);
                if (onProjectSelect) onProjectSelect(null, null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'salas'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Salas
            </button>
          </div>
        )}

        {/* Search Bar */}
        {!showCreateWizard && (
          <div className="relative animate-in fade-in slide-in-from-top duration-500 delay-100">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'projetos' ? 'Buscar projetos...' : 'Buscar salas...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Limpa a seleção quando a busca muda
                if (!e.target.value.trim()) {
                  setSelectedProject(null);
                  if (onProjectSelect) {
                    onProjectSelect(null, null);
                  }
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        )}
        
        {/* Aviso para usuários deslogados */}
        {!showCreateWizard && !isLoggedIn && activeTab === 'projetos' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top duration-500 delay-200">
            <p className="text-xs text-blue-700 text-center">
              💡 Clique em um projeto para visualizar sua localização no mapa
            </p>
          </div>
        )}

        {/* User Actions - Criar Projeto/Sala */}
        {!showCreateWizard && isLoggedIn && (
          <div className="flex gap-2 mt-3">
            {activeTab === 'projetos' && (
              <button
                onClick={() => {
                  if (rooms.length === 0) {
                    alert('Você precisa criar pelo menos uma sala antes de criar um projeto.');
                  } else {
                    setShowCreateProjectModal(true);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Projeto
              </button>
            )}
            {activeTab === 'salas' && (
              <button
                onClick={() => setShowCreateWizard(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Nova Sala
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showProjectDetails && detailedProject ? (
          <div className="p-6 animate-in fade-in slide-in-from-right duration-500">
            {/* Cabeçalho com botão voltar */}
            <button
              onClick={handleBackFromDetails}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Voltar</span>
            </button>

            {/* Detalhes do Projeto */}
            <div className="space-y-4">
              {/* Badge do Número */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                  #{detailedProject.number}
                </span>
              </div>

              {/* Título */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {detailedProject.title}
                </h3>
              </div>

              {/* Localização */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Localização</h4>
                </div>
                <p className="text-blue-800">{detailedProject.room.name}</p>
                {detailedProject.room.description && (
                  <p className="text-sm text-blue-600 mt-1">{detailedProject.room.description}</p>
                )}
              </div>

              {/* Data de Criação */}
              {detailedProject.createdAt && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Data de Criação</h4>
                  </div>
                  <p className="text-gray-700">
                    {new Date(detailedProject.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(detailedProject.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Informações da Sala */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-3">Detalhes da Sala</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium text-gray-900">{detailedProject.room.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prédio:</span>
                    <span className="font-medium text-gray-900">{detailedProject.room.building}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Andar:</span>
                    <span className="font-medium text-gray-900">{detailedProject.room.floor}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidade:</span>
                    <span className="font-medium text-gray-900">{detailedProject.room.capacity} pessoas</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação para Usuários Logados */}
              {isLoggedIn && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      onProjectEdit(detailedProject);
                      setShowProjectDetails(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Projeto
                  </button>
                  <button
                    onClick={() => {
                      onProjectDelete(detailedProject);
                      setShowProjectDetails(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : showEditRoomForm && roomToEdit && onUpdateRoom && onCancelEditRoom ? (
          <div className="p-6 animate-in fade-in slide-in-from-right duration-500">
            <EditRoomForm
              room={roomToEdit}
              onComplete={() => {
                onCancelEditRoom();
              }}
              onCancel={onCancelEditRoom}
              onStartTracing={onStartTracing}
              onStopTracing={onStopTracing}
              isTracingPath={isTracingPath}
              tracedPath={tracedPath}
              roomPosition={roomPosition}
              onUpdateRoom={onUpdateRoom}
            />
          </div>
        ) : showCreateWizard ? (
          <div className="p-6 animate-in fade-in slide-in-from-right duration-500">
            <CreateRoomForm
              onComplete={() => {
                setShowCreateWizard(false);
                onStopTracing();
              }}
              onCancel={() => {
                setShowCreateWizard(false);
                onStopTracing();
              }}
              onStartTracing={onStartTracing}
              onStopTracing={onStopTracing}
              isTracingPath={isTracingPath}
              tracedPath={tracedPath}
              roomPosition={roomPosition}
              onCreateRoom={onCreateRoom}
            />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">
                {activeTab === 'projetos' ? 'Carregando projetos...' : 'Carregando salas...'}
              </p>
            </div>
          </div>
        ) : activeTab === 'projetos' ? (
          // Lista de Projetos
          filteredProjects.length === 0 ? (
            <div className="flex items-center justify-center h-64 animate-in fade-in zoom-in duration-500">
              <div className="text-center">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-sm text-gray-500 mb-2">
                  {searchQuery ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
                </p>
                <p className="text-xs text-gray-400">
                  {searchQuery ? 'Tente uma busca diferente' : 'Adicione uma sala com projetos para começar'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className={`group relative bg-white border rounded-xl p-4 transition-all hover:shadow-md hover:border-blue-300 animate-in fade-in slide-in-from-bottom ${
                    selectedProject?.id === project.id
                      ? 'border-blue-500 shadow-md bg-blue-50/50'
                      : 'border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
                >
                <div onClick={() => handleProjectClick(project)} className="cursor-pointer">
                  {/* Project Number Badge */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                      #{project.number}
                    </span>
                    {selectedProject?.id === project.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* Project Title */}
                  <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{project.room.name}</span>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                  </div>
                </div>

                {/* Botões de Ação - Apenas para Usuários Logados */}
                {isLoggedIn && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectEdit(project);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar projeto"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectDelete(project);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                )}

                {/* Hover Effect Indicator */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        )
        ) : (
          // Lista de Salas
          filteredRooms.length === 0 ? (
            <div className="flex items-center justify-center h-64 animate-in fade-in zoom-in duration-500">
              <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-sm text-gray-500 mb-2">
                  {searchQuery ? 'Nenhuma sala encontrada' : 'Nenhuma sala cadastrada'}
                </p>
                <p className="text-xs text-gray-400">
                  {searchQuery ? 'Tente uma busca diferente' : 'Adicione salas para começar'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredRooms.map((room, index) => (
                <div
                  key={room.id}
                  className="group relative bg-white border border-gray-200 rounded-xl p-4 transition-all hover:shadow-md hover:border-blue-300 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
                >
                  <div 
                    onClick={() => {
                      if (onRoomSelect) {
                        onRoomSelect(room);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {/* Room Name */}
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {room.name}
                    </h3>

                    {/* Room Description */}
                    {room.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    {/* Projects Count */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {room.projects?.length || 0} {room.projects?.length === 1 ? 'projeto' : 'projetos'}
                      </span>
                    </div>
                  </div>

                  {/* Botões de Ação - Apenas para Usuários Logados */}
                  {isLoggedIn && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRoomEdit(room);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar sala"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRoomDelete(room);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir sala"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  )}

                  {/* Hover Effect Indicator */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer Stats */}
      {!showCreateWizard && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow duration-300 animate-in fade-in slide-in-from-left duration-500 delay-200">
              <div className="text-2xl font-bold text-gray-900">{rooms.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Salas</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow duration-300 animate-in fade-in slide-in-from-right duration-500 delay-200">
              <div className="text-2xl font-bold text-blue-600">{totalProjects}</div>
              <div className="text-xs text-gray-500 mt-0.5">Projetos</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Projeto */}
      {showCreateProjectModal && (
        <ProjectForm
          rooms={rooms}
          onSubmit={async (projectData) => {
            if (onProjectCreateSubmit) {
              await onProjectCreateSubmit(projectData);
              setShowCreateProjectModal(false);
            }
          }}
          onCancel={() => setShowCreateProjectModal(false)}
        />
      )}
    </div>
  );
};

export default MapSidebar;
