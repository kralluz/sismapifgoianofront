import React, { useState, useMemo } from 'react';
import { Search, Calendar, MapPin, Clock, ChevronRight, X, Plus } from 'lucide-react';
import type { Room, Project } from '../../types';
import CreateRoomForm from './CreateRoomForm';
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
  // Props para o wizard
  isTracingPath: boolean;
  onStartTracing: () => void;
  onStopTracing: () => void;
  tracedPath: Array<[number, number]>;
  roomPosition: { x: number; y: number } | null;
  onCreateRoom: (data: any, path: Array<[number, number]>, position: { x: number; y: number }) => Promise<void>;
}

const MapSidebar: React.FC<MapSidebarProps> = ({
  rooms,
  loading,
  sidebarMinimized,
  setSidebarMinimized,
  onRoomSelect,
  onProjectSelect,
  isTracingPath,
  onStartTracing,
  onStopTracing,
  tracedPath,
  roomPosition,
  onCreateRoom,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showCreateWizard, setShowCreateWizard] = useState(false);
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
      project.type.toLowerCase().includes(query) ||
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

  const handleProjectClick = (project: Project & { room: Room }) => {
    setSelectedProject(project);
    // Notifica o componente pai sobre a seleção do projeto
    if (onProjectSelect) {
      onProjectSelect(project.id, project.room);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (sidebarMinimized) {
    return (
      <div className="bg-white shadow-2xl flex flex-col flex-shrink-0 z-20 w-16 border-r border-gray-100 transition-all duration-300 ease-in-out animate-in slide-in-from-left">
        <button
          onClick={() => setSidebarMinimized(false)}
          className="p-4 hover:bg-gray-50 transition-colors group"
          title="Expandir menu"
        >
          <ChevronRight className="w-6 h-6 text-gray-600 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-2xl flex flex-col flex-shrink-0 z-20 w-80 lg:w-96 border-r border-gray-100 transition-all duration-300 ease-in-out animate-in slide-in-from-left">
      {/* Modern Header */}
      <div className="p-6 border-b border-gray-100 animate-in fade-in slide-in-from-top duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-2xl font-bold text-gray-900">Mapa IF</h1>
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

        {/* Admin Actions */}
        {!showCreateWizard && isAdmin && (
          <button
            onClick={() => setShowCreateWizard(true)}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Sala
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showCreateWizard ? (
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
                  onClick={() => handleProjectClick(project)}
                  className={`group relative bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 animate-in fade-in slide-in-from-bottom ${
                    selectedProject?.id === project.id
                      ? 'border-blue-500 shadow-md bg-blue-50/50'
                      : 'border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
                >
                {/* Project Type Badge */}
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                    {project.type}
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

                {/* Date & Time */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(project.startAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(project.startAt)}</span>
                  </div>
                </div>

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
                  onClick={() => {
                    if (onRoomSelect) {
                      onRoomSelect(room);
                    }
                  }}
                  className="group relative bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
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
    </div>
  );
};

export default MapSidebar;
