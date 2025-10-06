import React, { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import type { Room, Project } from '../../types';
import CreateRoomWizard from './CreateRoomWizard';
import RoomListView from './RoomListView';

interface RoomWithProjects extends Room {
  projects?: Project[];
}

interface MapSidebarProps {
  rooms: RoomWithProjects[];
  loading: boolean;
  sidebarMinimized: boolean;
  setSidebarMinimized: (value: boolean) => void;
  onRoomSelect: (room: Room) => void;
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
  onRoomEdit,
  onRoomDelete,
  onProjectCreate,
  onProjectEdit,
  onProjectDelete,
  isTracingPath,
  onStartTracing,
  onStopTracing,
  tracedPath,
  roomPosition,
  onCreateRoom,
}) => {
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const totalProjects = rooms.reduce((sum, room) => sum + (room.projects?.length || 0), 0);

  return (
    <div className={`bg-white shadow-xl flex flex-col flex-shrink-0 z-20 transition-all duration-300 ${sidebarMinimized ? 'w-16' : 'w-80 lg:w-96'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            {!sidebarMinimized && (
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  Gerenciar Salas
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{rooms.length} salas</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span>{totalProjects} projetos</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Botão de Minimizar */}
          <button
            onClick={() => setSidebarMinimized(!sidebarMinimized)}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
            title={sidebarMinimized ? "Expandir menu" : "Minimizar menu"}
          >
            {sidebarMinimized ? (
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Botão Nova Sala */}
        {!sidebarMinimized && !showCreateWizard && (
          <button
            onClick={() => setShowCreateWizard(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Sala
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!sidebarMinimized && (
          <div className="p-4">
            {showCreateWizard ? (
              <CreateRoomWizard
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
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Salas Cadastradas</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Gerencie salas e seus projetos
                  </p>
                </div>
                
                <RoomListView
                  rooms={rooms}
                  loading={loading}
                  onRoomSelect={onRoomSelect}
                  onRoomEdit={onRoomEdit}
                  onRoomDelete={onRoomDelete}
                  onProjectCreate={onProjectCreate}
                  onProjectEdit={onProjectEdit}
                  onProjectDelete={onProjectDelete}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!sidebarMinimized && !showCreateWizard && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Legenda:</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                <span>Salas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                <span>Rotas</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSidebar;
