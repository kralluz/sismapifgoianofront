import React, { useState } from "react";
import type { MouseEvent } from "react";
import {
  Edit3,
  Save,
  X,
  Trash2,
  Route,
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";
import type {
  Room,
  Event,
  RoomType,
  PathPoint,
  PopoverPosition,
} from "./types";
import { createPathPoint } from "./pathUtils";
import campusMapData from "./campusMapData.json";

// Componentes
import MapHeader from "./components/CampusMap/MapHeader";
import InteractiveMapSVG from "./components/CampusMap/InteractiveMapSVG";
import RoomPopover from "./components/CampusMap/RoomPopover";
import RoomList from "./components/CampusMap/RoomList";

// Hooks
import { useMapInteraction } from "./hooks/useMapInteraction";

const CampusMapMVP: React.FC = () => {
  // Estados principais
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showPath, setShowPath] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");

  // Estados de edição
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isCreatingPath, setIsCreatingPath] = useState<boolean>(false);
  const [tempPathPoints, setTempPathPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [showEditPanel, setShowEditPanel] = useState<boolean>(false);
  const [userPathPoints, setUserPathPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [isPlacingUserPath, setIsPlacingUserPath] = useState<boolean>(false);

  // Hook para interação do mapa
  const mapInteraction = useMapInteraction(isEditMode);

  // Estados dos rooms
  const [rooms, setRooms] = useState<Room[]>(() => {
    return campusMapData.map((room) => ({
      ...room,
      id: parseInt(room.id.toString()) || Date.now(),
      type: room.type as RoomType,
    }));
  });

  // Funções utilitárias
  const getPathToRoom = (roomId: number): PathPoint[] => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.path || room.path.length === 0) return [];

    return room.path.map((point, index) => {
      let type: PathPoint["type"] = "waypoint";
      let label = "";

      if (index === 0) {
        type = "entrance";
        label = "Entrada Principal";
      } else if (index === (room.path?.length || 0) - 1) {
        type = "destination";
        label = room.name;
      }

      return createPathPoint(point[0], point[1], type, label);
    });
  };

  const getPopoverPosition = (room: Room | null): PopoverPosition => {
    if (!room) return { top: "1rem", left: "1rem" };

    // Lógica simplificada para posicionamento
    let left = room.x > 50 ? "auto" : "1rem";
    let top = room.y > 50 ? "auto" : "1rem";

    return { left, top };
  };

  // Handlers
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setEditingRoom(null);
    setIsCreatingPath(false);
    setTempPathPoints([]);
    setShowEditPanel(false);
    setIsPlacingUserPath(false);
    setUserPathPoints([]);
  };

  const handleToggleUserPath = () => {
    setIsPlacingUserPath(!isPlacingUserPath);
    if (!isPlacingUserPath) {
      setUserPathPoints([]);
    }
  };

  const handleMapClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!isEditMode) return;

    // Lógica simplificada para clique no mapa
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    if (isPlacingUserPath) {
      setUserPathPoints((prev) => [...prev, { x: clampedX, y: clampedY }]);
    } else if (isCreatingPath) {
      setTempPathPoints((prev) => [...prev, { x: clampedX, y: clampedY }]);
    } else {
      const newRoom: Room = {
        id: Date.now(),
        name: `Novo Local ${rooms.length + 1}`,
        x: clampedX,
        y: clampedY,
        description: "Local personalizado",
        capacity: 20,
        type: "classroom",
        floor: 1,
        building: "X",
        amenities: [],
      };
      setRooms((prev) => [...prev, newRoom]);
      setEditingRoom(newRoom);
    }
  };

  const handleRoomClick = (room: Room) => {
    if (isEditMode && !isCreatingPath) {
      setEditingRoom(room);
      setShowEditPanel(true);
      return;
    }

    if (isCreatingPath) {
      if (tempPathPoints.length < 1) {
        alert("Adicione pelo menos um ponto antes de finalizar o caminho clicando em uma sala.");
        return;
      }

      alert(`Caminho para ${room.name} criado com sucesso!`);
      setTempPathPoints([]);
      setIsCreatingPath(false);
    }

    setSelectedRoom(room);
    setSelectedEvent(null);
    setShowPath(true);
  };

  const saveRoomEdit = (updatedRoom: Room) => {
    setRooms((prev) =>
      prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room))
    );
    setEditingRoom(null);
    setShowEditPanel(false);
  };

  const deleteRoom = (roomId: number) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    setEditingRoom(null);
    setShowEditPanel(false);
  };

  const startPathCreation = () => {
    setIsCreatingPath(true);
    setTempPathPoints([]);
    setSelectedRoom(null);
    setShowEditPanel(false);
  };

  const validateCurrentPath = (points: { x: number; y: number }[]) => {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (points.length < 2 && points.length > 0) {
      errors.push("Adicione pelo menos mais um ponto para criar um caminho válido");
    }

    return { isValid: errors.length === 0, warnings, errors };
  };

  // Handlers para o InteractiveMapSVG
  const handleRemoveTempPoint = (index: number) => {
    setTempPathPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUserPoint = (index: number) => {
    setUserPathPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setShowEditPanel(true);
  };

  const handleFinalizePath = () => {
    if (tempPathPoints.length >= 2) {
      alert('Caminho criado com sucesso!');
      setTempPathPoints([]);
      setIsCreatingPath(false);
    }
  };

  const handleClearPath = () => {
    setTempPathPoints([]);
  };

  const handleCancelPath = () => {
    setIsCreatingPath(false);
    setTempPathPoints([]);
  };

  const handleClosePopover = () => {
    setSelectedRoom(null);
    setShowPath(false);
    setSelectedEvent(null);
  };

  const displayPathPoints = showPath && selectedRoom ? getPathToRoom(selectedRoom.id) : [];

  return (
    <div className="h-full w-full flex bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Painel Lateral Desktop - Locais do Campus - FIXO */}
      <div className="hidden lg:flex lg:w-80 bg-white border-r border-gray-200 shadow-lg flex-col fixed left-0 top-0 bottom-0 z-30">
        <RoomList
          rooms={rooms}
          selectedRoom={selectedRoom}
          searchTerm={searchTerm}
          filterType={filterType}
          onSearchChange={setSearchTerm}
          onFilterChange={setFilterType}
          onRoomClick={handleRoomClick}
        />
      </div>

      {/* Container do Mapa */}
      <div className="flex-1 flex flex-col lg:ml-80">
        {/* Header com controles - FIXO */}
        <div className="lg:fixed lg:top-0 lg:right-0 lg:left-80 lg:z-40">
          <MapHeader
            isEditMode={isEditMode}
            onToggleEditMode={handleToggleEditMode}
            isCreatingPath={isCreatingPath}
            isPlacingUserPath={isPlacingUserPath}
            onToggleUserPath={handleToggleUserPath}
            tempPathPoints={tempPathPoints}
            userPathPoints={userPathPoints}
          />
        </div>

        {/* Mapa Container */}
        <div className="flex-1 relative lg:pt-24 lg:pb-0 pb-64">
          <InteractiveMapSVG
            rooms={rooms}
            selectedRoom={selectedRoom}
            showPath={showPath}
            displayPathPoints={displayPathPoints}
            isEditMode={isEditMode}
            isCreatingPath={isCreatingPath}
            isPlacingUserPath={isPlacingUserPath}
            tempPathPoints={tempPathPoints}
            userPathPoints={userPathPoints}
            editingRoom={editingRoom}
            mapInteraction={mapInteraction}
            onMapClick={handleMapClick}
            onRoomClick={handleRoomClick}
            onRemoveTempPoint={handleRemoveTempPoint}
            onRemoveUserPoint={handleRemoveUserPoint}
            onEditRoom={handleEditRoom}
            validateCurrentPath={validateCurrentPath}
            onFinalizePath={handleFinalizePath}
            onClearPath={handleClearPath}
            onCancelPath={handleCancelPath}
          />
          
          {/* (controles agora são fixos fora deste container) */}
        </div>
      </div>

      {/* Menu Inferior Mobile - Locais do Campus - FIXO */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 h-64">
        <RoomList
          rooms={rooms}
          selectedRoom={selectedRoom}
          searchTerm={searchTerm}
          filterType={filterType}
          onSearchChange={setSearchTerm}
          onFilterChange={setFilterType}
          onRoomClick={handleRoomClick}
        />
      </div>

      {/* Controles de Navegação Fixos (únicos) */}
      <div
        className="fixed right-4 lg:right-6 flex flex-col gap-2 z-[70] pointer-events-auto"
        /* Em telas pequenas colocamos acima do painel h-64 (16rem) */
        style={{ bottom: 'clamp(1.5rem, 16rem + 1.5rem, 18rem)' }}
      >
        <button
          onClick={mapInteraction.handleZoomIn}
          aria-label="Aumentar zoom"
          className="bg-white rounded-lg p-3 shadow-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 group hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Aumentar zoom"
        >
          <Plus className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
        </button>
        <button
          onClick={mapInteraction.handleZoomOut}
          aria-label="Diminuir zoom"
          className="bg-white rounded-lg p-3 shadow-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 group hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Diminuir zoom"
        >
          <Minus className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
        </button>
        <button
          onClick={mapInteraction.resetView}
          aria-label="Centralizar mapa"
          className="bg-white rounded-lg p-3 shadow-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 group hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Centralizar mapa"
        >
          <RotateCcw className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
        </button>
        {/* Acessibilidade por teclado: atalhos indicados futuramente em tooltip */}
      </div>

      {/* Popover da sala */}
      {selectedRoom && !isEditMode && (
        <RoomPopover
          room={selectedRoom}
          event={selectedEvent}
          position={getPopoverPosition(selectedRoom)}
          onClose={handleClosePopover}
        />
      )}

      {/* Painel de Edição */}
      {showEditPanel && editingRoom && (
        <EditRoomPanel
          room={editingRoom}
          onSave={saveRoomEdit}
          onDelete={deleteRoom}
          onCancel={() => {
            setEditingRoom(null);
            setShowEditPanel(false);
          }}
          onStartPath={startPathCreation}
        />
      )}
    </div>
  );
};

interface EditRoomPanelProps {
  room: Room;
  onSave: (room: Room) => void;
  onDelete: (roomId: number) => void;
  onCancel: () => void;
  onStartPath: (room: Room) => void;
}

const EditRoomPanel: React.FC<EditRoomPanelProps> = ({
  room,
  onSave,
  onDelete,
  onCancel,
  onStartPath,
}) => {
  const [editedRoom, setEditedRoom] = useState<Room>({ ...room });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(editedRoom);
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-xl shadow-2xl p-6 max-w-md border border-gray-200 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Editar Local
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={editedRoom.name}
            onChange={(e) =>
              setEditedRoom({ ...editedRoom, name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={editedRoom.description}
            onChange={(e) =>
              setEditedRoom({ ...editedRoom, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={editedRoom.type}
              onChange={(e) =>
                setEditedRoom({
                  ...editedRoom,
                  type: e.target.value as RoomType,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="classroom">Sala de Aula</option>
              <option value="lab">Laboratório</option>
              <option value="library">Biblioteca</option>
              <option value="auditorium">Auditório</option>
              <option value="restaurant">Cantina</option>
              <option value="office">Escritório</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidade
            </label>
            <input
              type="number"
              value={editedRoom.capacity}
              onChange={(e) =>
                setEditedRoom({
                  ...editedRoom,
                  capacity: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prédio
            </label>
            <input
              type="text"
              value={editedRoom.building}
              onChange={(e) =>
                setEditedRoom({ ...editedRoom, building: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Andar
            </label>
            <input
              type="number"
              value={editedRoom.floor}
              onChange={(e) =>
                setEditedRoom({
                  ...editedRoom,
                  floor: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recursos (separados por vírgula)
          </label>
          <input
            type="text"
            value={editedRoom.amenities ? editedRoom.amenities.join(", ") : ""}
            onChange={(e) =>
              setEditedRoom({
                ...editedRoom,
                amenities: e.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Projetor, Ar condicionado, Wi-Fi"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>

          <button
            type="button"
            onClick={() => onStartPath(room)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            title="Criar caminho personalizado"
          >
            <Route className="w-4 h-4" />
            Caminho
          </button>

          <button
            type="button"
            onClick={() => onDelete(room.id)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            title="Excluir local"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampusMapMVP;
