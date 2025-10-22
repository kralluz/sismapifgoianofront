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
  const [activeTab, setActiveTab] = useState<'projetos' | 'salas'>(isLoggedIn ? 'projetos' : 'projetos');

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

  // Função para verificar se está em dispositivo móvel
  const isMobile = () => window.innerWidth < 768;

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
      // Ocultar a barra lateral apenas em dispositivos móveis
      if (isMobile()) {
        setSidebarMinimized(true);
      }
    }
  };

  if (sidebarMinimized) {
    return (
      <button
        onClick={() => setSidebarMinimized(false)}
        className="absolute left-0 top-20 z-20 bg-white shadow-lg border border-gray-200 rounded-r-lg p-3 hover:bg-gray-50 transition-all hover:pr-4 group"
        title="Expandir menu"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
      </button>
    );
  }

  return (
    <div className="relative shadow-2xl flex flex-col flex-shrink-0 z-20 w-80 lg:w-96 border-r border-white/30 transition-all duration-300 ease-in-out animate-in slide-in-from-left h-screen backdrop-blur-2xl" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}>
      {/* Modern Header */}
      <div className="p-6 border-b border-white/30 animate-in fade-in slide-in-from-top duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-2xl font-bold text-gray-900">SisMap</h1>
            {isLoggedIn && (
              <p className="text-sm text-gray-500 mt-0.5">
                {activeTab === 'projetos' ? `${totalProjects} projetos` : `${rooms.length} salas`}
              </p>
            )}
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
        {!showCreateWizard && isLoggedIn && (
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
            {isLoggedIn && (
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
            )}
          </div>
        )}        {/* Search Bar */}
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
        {!showCreateWizard && !isLoggedIn && (
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
        {showEditRoomForm && roomToEdit && onUpdateRoom && onCancelEditRoom ? (
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
            <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
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
                  className={`group relative backdrop-blur-2xl border rounded-2xl p-4 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] animate-in fade-in slide-in-from-bottom ${
                    selectedProject?.id === project.id
                      ? 'border-blue-400/60 shadow-2xl scale-[1.02]'
                      : 'border-white/40 hover:border-blue-300/60'
                  }`}
                  style={{ 
                    animationDelay: `${index * 50}ms`, 
                    animationDuration: '400ms',
                    background: selectedProject?.id === project.id 
                      ? 'linear-gradient(135deg, rgba(239, 246, 255, 0.5) 0%, rgba(219, 234, 254, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%)',
                    boxShadow: selectedProject?.id === project.id 
                      ? '0 10px 40px 0 rgba(59, 130, 246, 0.3), inset 0 2px 4px 0 rgba(255, 255, 255, 0.6)' 
                      : '0 6px 20px 0 rgba(31, 38, 135, 0.12), inset 0 1px 2px 0 rgba(255, 255, 255, 0.5)'
                  }}
                >
                <div onClick={() => handleProjectClick(project)} className="cursor-pointer">
                  {/* Project Number Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-md" style={{ background: 'linear-gradient(135deg, rgba(216, 180, 254, 0.6) 0%, rgba(251, 207, 232, 0.6) 100%)' }}>
                      <span className="text-purple-700">#{project.number}</span>
                    </span>
                    {selectedProject?.id === project.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* Project Title */}
                  <h3 className="font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors text-base">
                    {project.title}
                  </h3>

                  {/* Location */}
                  <div className="p-3 backdrop-blur-md border border-blue-300/40 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.5) 0%, rgba(219, 234, 254, 0.3) 100%)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Localização</span>
                    </div>
                    <p className="text-sm text-blue-800">{project.room.name}</p>
                    {project.room.description && (
                      <p className="text-xs text-blue-600 mt-1">{project.room.description}</p>
                    )}
                  </div>
                </div>

                {/* Botões de Ação - Apenas para Usuários Logados */}
                {isLoggedIn && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectEdit(project);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 backdrop-blur-sm hover:backdrop-blur-md rounded-lg transition-all" style={{ background: 'rgba(239, 246, 255, 0.5)' }}
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
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 backdrop-blur-sm hover:backdrop-blur-md rounded-lg transition-all" style={{ background: 'rgba(254, 242, 242, 0.5)' }}
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
            <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
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
                  className="group relative backdrop-blur-xl border border-white/50 rounded-xl p-4 transition-all hover:shadow-xl hover:border-blue-300/50 animate-in fade-in slide-in-from-bottom"
                  style={{ 
                    animationDelay: `${index * 50}ms`, 
                    animationDuration: '400ms',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1), inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div 
                    onClick={() => {
                      // Ocultar a barra lateral apenas em dispositivos móveis
                      if (isMobile()) {
                        setSidebarMinimized(true);
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
        {!showCreateWizard && isLoggedIn && (
        <div className="p-4 border-t border-white/30 backdrop-blur-xl animate-in fade-in slide-in-from-bottom duration-700" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="backdrop-blur-lg rounded-lg p-3 border border-white/40 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-left duration-500 delay-200" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.45) 100%)', boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)' }}>
              <div className="text-2xl font-bold text-gray-900">{rooms.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Salas</div>
            </div>
            <div className="backdrop-blur-lg rounded-lg p-3 border border-white/40 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right duration-500 delay-200" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.45) 100%)', boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)' }}>
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
