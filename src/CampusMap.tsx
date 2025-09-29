import React, { useState, useEffect } from "react";
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
  Loader2,
  MapPin,
} from "lucide-react";
import type {
  Room,
  Event,
  RoomType,
  PathPoint,
  PopoverPosition,
  CreateRoomRequest,
} from "./types";
import { createPathPoint } from "./pathUtils";
import { useRoom } from "./provider/RoomContext";

// Componentes
import MapHeader from "./components/CampusMap/MapHeader";
import InteractiveMapSVG from "./components/CampusMap/InteractiveMapSVG";
import RoomPopover from "./components/CampusMap/RoomPopover";
import RoomList from "./components/CampusMap/RoomList";

// Hooks
import { useMapInteraction } from "./hooks/useMapInteraction";

const CampusMapMVP: React.FC = () => {
  // Modal de criação de sala
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomCoords, setNewRoomCoords] = useState<{ x: number; y: number } | null>(null);
  const [newRoomData, setNewRoomData] = useState({
    name: "",
    description: "",
    capacity: 20,
    type: "classroom",
    floor: 1,
    building: "Campus Principal",
    amenities: ""
  });
  // Room Context - API integration
  const { 
    rooms: apiRooms, 
    isLoading: roomsLoading, 
    error: roomsError, 
    fetchRooms, 
    createRoom: createRoomAPI, 
    updateRoom: updateRoomAPI, 
    deleteRoom: deleteRoomAPI,
    clearError 
  } = useRoom();

  // Ensure we have a token for development
  React.useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      // Set a dummy token for development
      localStorage.setItem("authToken", "dev-token-for-testing");
      localStorage.setItem("authUser", JSON.stringify({
        id: 1,
        nome: "Dev User",
        email: "dev@test.com",
        role: "admin"
      }));
    }
  }, []);

  // Estados principais
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showPath, setShowPath] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);

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
  
  // Estados de feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Hook para interação do mapa
  const mapInteraction = useMapInteraction(isEditMode);

  // Load rooms from API on component mount - ONE TIME ONLY
  useEffect(() => {
    fetchRooms().catch((error) => {
      console.error('Erro ao carregar salas:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - runs only once on mount to prevent infinite loop

  // Use API rooms - NO FALLBACK TO MOCK DATA
  const rooms = apiRooms || [];

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
    console.log('Map clicked!', { isEditMode, isCreatingPath, isPlacingUserPath });
    
    // Prevent action if dragging
    if (mapInteraction.isDragging) {
      console.log('Ignoring click because dragging');
      return;
    }
    
    // Get basic coordinates first
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    console.log('Click coordinates:', { x, y });
    
    if (isEditMode && !isCreatingPath && !isPlacingUserPath) {
      console.log('Creating new room at:', { x, y });
      // Create new room
      setNewRoomCoords({ x, y });
      setShowCreateRoomModal(true);
    } else if (isCreatingPath) {
      console.log('Adding point to path');
      // Add point to path
      setTempPathPoints(prev => [...prev, { x, y }]);
    } else if (isPlacingUserPath) {
      console.log('Adding point to user path');
      // Add point to user path
      setUserPathPoints(prev => [...prev, { x, y }]);
    } else {
      console.log('No action taken - mode:', { isEditMode, isCreatingPath, isPlacingUserPath });
    }
  };
  // Função para criar sala via modal
  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomCoords) return;
    
    // Validate required fields
    if (!newRoomData.name.trim()) {
      alert("Nome da sala é obrigatório");
      return;
    }
    
    setIsCreatingRoom(true);
    
    const roomData: CreateRoomRequest = {
      name: newRoomData.name.trim(),
      x: newRoomCoords.x,
      y: newRoomCoords.y,
      description: newRoomData.description.trim() || `Sala ${newRoomData.name.trim()}`,
      capacity: Number(newRoomData.capacity) || 20,
      type: newRoomData.type,
      floor: Number(newRoomData.floor) || 1,
      building: newRoomData.building.trim() || "Campus Principal",
      amenities: newRoomData.amenities.split(",").map(a => a.trim()).filter(a => a),
      path: []
    };
    
    try {
      const createdRoom = await createRoomAPI(roomData);
      console.log('Sala criada com sucesso:', createdRoom);
      
      // Automatically edit the newly created room
      setEditingRoom(createdRoom);
      setShowEditPanel(true);
      setSuccessMessage(`Sala "${createdRoom.name}" criada com sucesso!`);
      
      // Close modal and reset state
      setShowCreateRoomModal(false);
      setNewRoomCoords(null);
      setNewRoomData({
        name: "",
        description: "",
        capacity: 20,
        type: "classroom",
        floor: 1,
        building: "Campus Principal",
        amenities: ""
      });
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      const errorMsg = error instanceof Error ? error.message : "Erro ao criar sala. Tente novamente.";
      alert(errorMsg);
    } finally {
      setIsCreatingRoom(false);
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
    if (updatedRoom.id && updatedRoom.id > 0) {
      // Update existing room
      updateRoomAPI(updatedRoom.id, {
        name: updatedRoom.name,
        x: updatedRoom.x,
        y: updatedRoom.y,
        description: updatedRoom.description,
        capacity: updatedRoom.capacity,
        type: updatedRoom.type,
        floor: updatedRoom.floor,
        building: updatedRoom.building,
        amenities: updatedRoom.amenities,
        path: updatedRoom.path,
      })
        .then(() => {
          setEditingRoom(null);
          setShowEditPanel(false);
          setSuccessMessage('Sala atualizada com sucesso!');
        })
        .catch((error) => {
          console.error('Erro ao atualizar sala:', error);
          alert('Erro ao atualizar sala. Verifique sua conexão e tente novamente.');
        });
    }
  };

  const deleteRoom = (roomId: number) => {
    if (roomId && roomId > 0) {
      deleteRoomAPI(roomId)
        .then(() => {
          setEditingRoom(null);
          setShowEditPanel(false);
          setSuccessMessage('Sala deletada com sucesso!');
          // Clear selection if deleted room was selected
          if (selectedRoom?.id === roomId) {
            setSelectedRoom(null);
            setShowPath(false);
          }
        })
        .catch((error) => {
          console.error('Erro ao deletar sala:', error);
          alert('Erro ao deletar sala. Verifique sua conexão e tente novamente.');
        });
    }
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

  const handleFinalizePath = async () => {
    if (tempPathPoints.length >= 2) {
      try {
        // For now, just show success - later we can add path persistence to API
        setSuccessMessage(`Caminho criado com ${tempPathPoints.length} pontos!`);
        setTempPathPoints([]);
        setIsCreatingPath(false);
      } catch (error) {
        console.error('Erro ao salvar caminho:', error);
        alert('Erro ao salvar caminho. Tente novamente.');
      }
    } else {
      alert('É necessário pelo menos 2 pontos para criar um caminho.');
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
      {/* Loading Overlay */}
      {roomsLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-700 font-medium">Carregando salas...</span>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-white/80 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Toast */}
      {roomsError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm font-medium">{roomsError}</span>
          <button
            onClick={clearError}
            className="text-white/80 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          
          {/* Status Bar - Show current mode */}
          {(isEditMode || isCreatingPath || isPlacingUserPath) && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                {isEditMode && !isCreatingPath && !isPlacingUserPath && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      <span>Modo de Edição Ativo - Clique no mapa para criar uma sala</span>
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      💡 Dica: Clique em uma área vazia do mapa para adicionar uma nova sala
                    </div>
                    <button 
                      onClick={() => {
                        console.log('Test button clicked');
                        setNewRoomCoords({ x: 50, y: 50 });
                        setShowCreateRoomModal(true);
                      }}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      Teste: Criar sala no centro
                    </button>
                  </div>
                )}
                {isCreatingPath && (
                  <>
                    <Route className="w-4 h-4" />
                    <span>Criando Caminho - Clique no mapa para adicionar pontos ({tempPathPoints.length} pontos)</span>
                  </>
                )}
                {isPlacingUserPath && (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>Caminho do Usuário - Clique no mapa para marcar sua rota ({userPathPoints.length} pontos)</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mapa Container */}
        <div className={`flex-1 relative lg:pb-0 pb-64 ${
          (isEditMode || isCreatingPath || isPlacingUserPath) ? 'lg:pt-32' : 'lg:pt-24'
        }`}>
          {/* Modal de criação de sala */}
          {showCreateRoomModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <form onSubmit={handleCreateRoomSubmit} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md mx-4">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Criar Nova Sala
                </h2>
                
                {newRoomCoords && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      📍 Posição no mapa: ({newRoomCoords.x.toFixed(1)}, {newRoomCoords.y.toFixed(1)})
                    </p>
                  </div>
                )}
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input 
                    type="text" 
                    required 
                    value={newRoomData.name} 
                    onChange={e => setNewRoomData(d => ({ ...d, name: e.target.value }))} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Sala A1, Lab. Informática"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <input 
                    type="text" 
                    value={newRoomData.description} 
                    onChange={e => setNewRoomData(d => ({ ...d, description: e.target.value }))} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição opcional da sala"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Capacidade</label>
                    <input 
                      type="number" 
                      min={1} 
                      value={newRoomData.capacity} 
                      onChange={e => setNewRoomData(d => ({ ...d, capacity: Number(e.target.value) }))} 
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Andar</label>
                    <input 
                      type="number" 
                      min={1} 
                      value={newRoomData.floor} 
                      onChange={e => setNewRoomData(d => ({ ...d, floor: Number(e.target.value) }))} 
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select 
                    value={newRoomData.type} 
                    onChange={e => setNewRoomData(d => ({ ...d, type: e.target.value }))} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="classroom">Sala de Aula</option>
                    <option value="lab">Laboratório</option>
                    <option value="library">Biblioteca</option>
                    <option value="auditorium">Auditório</option>
                    <option value="restaurant">Restaurante</option>
                    <option value="office">Escritório</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Prédio</label>
                  <input 
                    type="text" 
                    value={newRoomData.building} 
                    onChange={e => setNewRoomData(d => ({ ...d, building: e.target.value }))} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Bloco A, Prédio Principal"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Recursos (separados por vírgula)</label>
                  <input 
                    type="text" 
                    value={newRoomData.amenities} 
                    onChange={e => setNewRoomData(d => ({ ...d, amenities: e.target.value }))} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Ex: Projetor, Ar condicionado, Quadro"
                  />
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button 
                    type="submit" 
                    disabled={isCreatingRoom}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isCreatingRoom ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Criar Sala
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    disabled={isCreatingRoom}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors" 
                    onClick={() => { 
                      setShowCreateRoomModal(false); 
                      setNewRoomCoords(null); 
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* Always show the map - even when no rooms */}
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

          {/* Empty state overlay when no rooms */}
          {rooms.length === 0 && !roomsLoading && !roomsError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="font-semibold text-gray-700 mb-2">Nenhuma sala cadastrada</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {isEditMode 
                    ? "Clique no mapa para adicionar a primeira sala" 
                    : "Ative o modo de edição para cadastrar salas"}
                </p>
                {!isEditMode && (
                  <button
                    onClick={handleToggleEditMode}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Ativar Modo de Edição
                  </button>
                )}
              </div>
            </div>
          )}
          
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
