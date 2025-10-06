import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Room, CreateRoomRequest } from '../types';
import { Plus, X, Loader2, MapPin, Info, Users, Building, Hash, Search } from 'lucide-react';

const SimpleMap: React.FC = () => {
  // Estados
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [newRoomCoords, setNewRoomCoords] = useState<{ x: number; y: number } | null>(null);
  // Estado para traçar caminho manualmente
  const [isTracingPath, setIsTracingPath] = useState(false);
  const [tracedPath, setTracedPath] = useState<Array<[number, number]>>([]);
  // Estados para pan e zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  // Dados do novo ponto/sala
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    type: 'classroom' as const,
    capacity: 20,
    floor: 1,
    building: 'Campus Principal',
  });

  // Garantir que temos um token para desenvolvimento
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      localStorage.setItem('authToken', 'dev-token-for-testing');
      localStorage.setItem('authUser', JSON.stringify({
        id: 1,
        nome: 'Dev User',
        email: 'dev@test.com',
        role: 'admin'
      }));
    }
  }, []);

  // Carregar salas existentes
  useEffect(() => {
    loadRooms();
  }, []);

  // Limpar mensagem de sucesso
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const roomsData = await api.getRooms();
      setRooms(roomsData);
    } catch (err) {
      console.error('Erro ao carregar salas:', err);
      setError('Erro ao carregar pontos do mapa');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Se estiver arrastando, não processar clique
    if (isDragging) return;
    
    // Traçar caminho manualmente
    if (isTracingPath) {
      const rect = e.currentTarget.getBoundingClientRect();
      // Coordenadas normalizadas considerando zoom e pan
      const x = ((e.clientX - rect.left) / rect.width * 100 - pan.x) / zoom;
      const y = ((e.clientY - rect.top) / rect.height * 100 - pan.y) / zoom;
      // Restringir às dimensões da imagem do mapa (0-100)
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));
      setTracedPath((prev) => [...prev, [clampedX, clampedY]]);
      // O ponto final do caminho será usado como posição da sala
      setNewRoomCoords({ x: clampedX, y: clampedY });
      return;
    }
    // Se estiver aguardando clique para posição
    if (!waitingForClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Coordenadas normalizadas considerando zoom e pan
    const x = ((e.clientX - rect.left) / rect.width * 100 - pan.x) / zoom;
    const y = ((e.clientY - rect.top) / rect.height * 100 - pan.y) / zoom;
    // Restringir às dimensões da imagem do mapa (0-100)
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    setNewRoomCoords({ x: clampedX, y: clampedY });
    setWaitingForClick(false);
  };

  const handleRoomClick = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que o clique no mapa seja disparado
    
    // Se estiver aguardando clique para editar posição
    if (waitingForClick && editMode === 'edit' && roomToEdit) {
      const rect = e.currentTarget.getBoundingClientRect();
      // Coordenadas normalizadas considerando zoom e pan
      const x = ((e.clientX - rect.left) / rect.width * 100 - pan.x) / zoom;
      const y = ((e.clientY - rect.top) / rect.height * 100 - pan.y) / zoom;
      // Restringir às dimensões da imagem do mapa (0-100)
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));
      
      // Atualizar posição da sala
      handleUpdateRoom({ ...roomToEdit, x: clampedX, y: clampedY });
      setWaitingForClick(false);
      setEditMode(null);
      setRoomToEdit(null);
      return;
    }
    
    // Mostrar detalhes normalmente
    setSelectedRoom(room);
    setShowRoomDetails(true);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomCoords || !newRoomData.name.trim()) return;
    setIsCreating(true);
    const roomData: CreateRoomRequest = {
      name: newRoomData.name.trim(),
      x: newRoomCoords.x,
      y: newRoomCoords.y,
      description: newRoomData.description.trim() || `Ponto ${newRoomData.name.trim()}`,
      capacity: newRoomData.capacity,
      type: newRoomData.type,
      floor: newRoomData.floor,
      building: newRoomData.building.trim(),
      amenities: [],
      path: tracedPath.length > 1 ? tracedPath : []
    };
    try {
      await api.createRoom(roomData);
      setSuccessMessage(`Ponto "${roomData.name}" criado com sucesso!`);
      closeModal();
      await loadRooms();
    } catch (err) {
      console.error('Erro ao criar sala:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar ponto';
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomCoords || !newRoomData.name.trim() || !roomToEdit) return;
    setIsCreating(true);
    try {
      await handleUpdateRoom({
        ...roomToEdit,
        ...newRoomData,
        x: newRoomCoords.x,
        y: newRoomCoords.y,
        path: tracedPath.length > 1 ? tracedPath : []
      });
      closeModal();
    } catch (err) {
      console.error('Erro ao editar sala:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao editar ponto';
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRoom = async (updatedRoom: Room) => {
    try {
      await api.updateRoom(updatedRoom.id.toString(), {
        name: updatedRoom.name,
        x: updatedRoom.x,
        y: updatedRoom.y,
        description: updatedRoom.description,
        capacity: updatedRoom.capacity,
        type: updatedRoom.type,
        floor: updatedRoom.floor,
        building: updatedRoom.building,
        amenities: updatedRoom.amenities || [],
        path: updatedRoom.path || []
      });
      
      setSuccessMessage(`Ponto "${updatedRoom.name}" atualizado com sucesso!`);
      await loadRooms();
    } catch (err) {
      console.error('Erro ao atualizar sala:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar ponto';
      setError(errorMsg);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!confirm(`Tem certeza que deseja excluir o ponto "${room.name}"?`)) return;
    
    setIsDeleting(true);
    try {
      await api.deleteRoom(room.id.toString());
      setSuccessMessage(`Ponto "${room.name}" excluído com sucesso!`);
      await loadRooms();
    } catch (err) {
      console.error('Erro ao excluir sala:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao excluir ponto';
      setError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const startCreateMode = () => {
    setEditMode('create');
    setWaitingForClick(false);
    setShowRoomDetails(false);
    setTracedPath([]);
    setIsTracingPath(true);
    setNewRoomCoords(null);
  };

  const startEditMode = (room: Room) => {
    setRoomToEdit(room);
    setEditMode('edit');
    setNewRoomData({
      name: room.name,
      description: room.description || '',
      type: room.type as any,
      capacity: room.capacity,
      floor: room.floor,
      building: room.building,
    });
    // Carregar caminho existente
    setTracedPath((room.path || []) as Array<[number, number]>);
    setNewRoomCoords({ x: room.x, y: room.y });
    setIsTracingPath(false);
    setWaitingForClick(false);
    setShowRoomDetails(false);
  };

  const cancelEditMode = () => {
    setEditMode(null);
    setRoomToEdit(null);
    setWaitingForClick(false);
    setNewRoomCoords(null);
    setIsTracingPath(false);
    setTracedPath([]);
  };

  const closeModal = () => {
    setNewRoomCoords(null);
    setEditMode(null);
    setRoomToEdit(null);
    setWaitingForClick(false);
    setIsTracingPath(false);
    setTracedPath([]);
    setNewRoomData({
      name: '',
      description: '',
      type: 'classroom',
      capacity: 20,
      floor: 1,
      building: 'Campus Principal',
    });
  };

  // Funções para controle de pan e zoom
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Só permitir pan se não estiver em modo de traçado ou aguardando clique
    if (isTracingPath || waitingForClick) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(5, prev * 1.2));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(0.5, prev / 1.2));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-gray-100 flex flex-col md:flex-row">
      {successMessage && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Pesquisa Mobile - Topo */}
      <div className="md:hidden bg-white border-b border-gray-200 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar locais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Barra Lateral Desktop */}
      {showSidebar && (
        <div className="hidden md:flex w-96 bg-white border-r border-gray-200 flex-col h-full">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">SisMap</h2>
                  <p className="text-xs text-blue-100">IF Goiano</p>
                </div>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar locais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{filteredRooms.length} de {rooms.length} locais</span>
              <span>{rooms.filter(room => room.path && room.path.length > 1).length} com rotas</span>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-gray-200">
            <button
              onClick={() => setShowEditMenu(!showEditMenu)}
              className={`w-full px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm ${
                showEditMenu ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showEditMenu ? (
                <>
                  <X className="w-4 h-4" />
                  Cancelar Edição
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modo Edição
                </>
              )}
            </button>
          </div>

          {showEditMenu && (
            <div className="px-4 py-3 border-b border-gray-200">
              {!waitingForClick && (
                <button
                  onClick={startCreateMode}
                  className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Local
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">Carregando...</p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">
                    {searchTerm ? 'Nenhum local encontrado' : 'Nenhum local cadastrado'}
                  </p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                    onClick={() => { setSelectedRoom(room); setShowRoomDetails(true); }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{room.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{room.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.capacity}</span>
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{room.building}</span>
                          <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{room.floor}° andar</span>
                        </div>
                      </div>
                      {room.path && room.path.length > 1 && (
                        <div className="ml-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div></div>
                      )}
                    </div>
                    {showEditMenu && !waitingForClick && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => startEditMode(room)} className="flex-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-200">Editar</button>
                        <button onClick={() => handleDeleteRoom(room)} disabled={isDeleting} className="flex-1 bg-red-100 text-red-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-200 disabled:opacity-50">
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Excluir'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {!showSidebar && (
        <button onClick={() => setShowSidebar(true)} className="hidden md:block absolute left-4 top-4 z-10 bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50">
          <MapPin className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Botão Mobile - Parte Inferior */}
      <button
        onClick={() => setShowMobileSheet(true)}
        className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium"
      >
        <MapPin className="w-5 h-5" />
        Ver Locais ({filteredRooms.length})
      </button>

      {/* Sheet Mobile - Lista de Locais */}
      {showMobileSheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileSheet(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-800">Locais</h2>
                <button onClick={() => setShowMobileSheet(false)}>
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">{filteredRooms.length} de {rooms.length} locais</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Carregando...</p>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">Nenhum local encontrado</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3 rounded-lg border bg-white border-gray-200 active:bg-gray-50"
                      onClick={() => { 
                        setSelectedRoom(room); 
                        setShowRoomDetails(true);
                        setShowMobileSheet(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">{room.name}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{room.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.capacity}</span>
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{room.floor}° andar</span>
                          </div>
                        </div>
                        {room.path && room.path.length > 1 && (
                          <div className="ml-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">

      {/* Seção de Criação/Edição de Sala */}
      {editMode === 'create' && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex items-start gap-6">
              {/* Formulário de dados da sala */}
              <div className="w-80 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Nova Sala/Ponto
                </h3>
                
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome do Ponto *</label>
                    <input 
                      type="text" 
                      required 
                      value={newRoomData.name} 
                      onChange={e => setNewRoomData(d => ({ ...d, name: e.target.value }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Ex: Entrada Principal, Sala 101"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <input 
                      type="text" 
                      value={newRoomData.description} 
                      onChange={e => setNewRoomData(d => ({ ...d, description: e.target.value }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Descrição opcional"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo</label>
                      <select 
                        value={newRoomData.type} 
                        onChange={e => setNewRoomData(d => ({ ...d, type: e.target.value as any }))} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="classroom">Sala de Aula</option>
                        <option value="lab">Laboratório</option>
                        <option value="library">Biblioteca</option>
                        <option value="auditorium">Auditório</option>
                        <option value="restaurant">Restaurante</option>
                        <option value="office">Escritório</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Capacidade</label>
                      <input 
                        type="number" 
                        min={1} 
                        value={newRoomData.capacity} 
                        onChange={e => setNewRoomData(d => ({ ...d, capacity: Number(e.target.value) }))} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                      />
                    </div>
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button 
                      type="submit" 
                      disabled={isCreating || !newRoomData.name.trim() || (!newRoomCoords && tracedPath.length === 0)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Criar Ponto
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      disabled={isCreating}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium text-sm" 
                      onClick={closeModal}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Controles de traçado de caminho */}
              <div className="flex-1">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    🛤️ Traçar Caminho
                  </h4>
                  
                  {/* Status do traçado */}
                  <div className="mb-4 p-3 bg-white rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700">
                      {tracedPath.length === 0 
                        ? "Clique no mapa para iniciar o traçado do caminho."
                        : newRoomCoords
                          ? `Caminho finalizado com ${tracedPath.length} pontos. Posição final: (${newRoomCoords.x.toFixed(1)}, ${newRoomCoords.y.toFixed(1)})`
                          : `Traçando caminho... ${tracedPath.length} pontos adicionados.`
                      }
                    </p>
                    {tracedPath.length > 0 && (
                      <div className="mt-2 text-xs text-orange-600">
                        Pontos: {tracedPath.map((p) => `(${p[0].toFixed(0)},${p[1].toFixed(0)})`).join(' → ')}
                      </div>
                    )}
                  </div>
                  
                  {/* Botões de controle */}
                  <div className="flex gap-2">
                    {!isTracingPath ? (
                      <button
                        type="button"
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center gap-2"
                        onClick={() => { setIsTracingPath(true); setTracedPath([]); setNewRoomCoords(null); }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        Iniciar Traçado
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
                          disabled={tracedPath.length === 0}
                          onClick={() => setTracedPath((prev) => prev.slice(0, -1))}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remover Último
                        </button>
                        
                        <button
                          type="button"
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
                          disabled={tracedPath.length < 2}
                          onClick={() => setIsTracingPath(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Finalizar Traçado
                        </button>
                        
                        <button
                          type="button"
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2"
                          onClick={() => { setIsTracingPath(false); setTracedPath([]); setNewRoomCoords(null); }}
                        >
                          <X className="w-4 h-4" />
                          Cancelar Traçado
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Dicas de uso */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-orange-200">
                    <h5 className="text-sm font-medium text-orange-800 mb-2">💡 Dicas de Uso:</h5>
                    <ul className="text-xs text-orange-700 space-y-1">
                      <li>• Clique no mapa para adicionar pontos sequenciais ao caminho</li>
                      <li>• O último ponto será a posição final da sala</li>
                      <li>• Use "Remover Último" para corrigir pontos errados</li>
                      <li>• Mínimo de 2 pontos para criar um caminho válido</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Edição de Sala */}
      {editMode === 'edit' && roomToEdit && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex items-start gap-6">
              {/* Formulário de dados da sala */}
              <div className="w-80 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Sala/Ponto
                </h3>
                
                <form onSubmit={handleEditRoom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome do Ponto *</label>
                    <input 
                      type="text" 
                      required 
                      value={newRoomData.name} 
                      onChange={e => setNewRoomData(d => ({ ...d, name: e.target.value }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Ex: Entrada Principal, Sala 101"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <input 
                      type="text" 
                      value={newRoomData.description} 
                      onChange={e => setNewRoomData(d => ({ ...d, description: e.target.value }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Descrição opcional"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo</label>
                      <select 
                        value={newRoomData.type} 
                        onChange={e => setNewRoomData(d => ({ ...d, type: e.target.value as any }))} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="classroom">Sala de Aula</option>
                        <option value="lab">Laboratório</option>
                        <option value="library">Biblioteca</option>
                        <option value="auditorium">Auditório</option>
                        <option value="restaurant">Restaurante</option>
                        <option value="office">Escritório</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Capacidade</label>
                      <input 
                        type="number" 
                        min={1} 
                        value={newRoomData.capacity} 
                        onChange={e => setNewRoomData(d => ({ ...d, capacity: Number(e.target.value) }))} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                      />
                    </div>
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button 
                      type="submit" 
                      disabled={isCreating || !newRoomData.name.trim() || (!newRoomCoords && tracedPath.length === 0)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Salvar Alterações
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      disabled={isCreating}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium text-sm" 
                      onClick={closeModal}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Controles de traçado de caminho */}
              <div className="flex-1">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    🛤️ Editar Caminho
                  </h4>
                  
                  {/* Status do traçado */}
                  <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      {isTracingPath
                        ? tracedPath.length === 0 
                          ? "Clique no mapa para iniciar um novo caminho."
                          : `Editando caminho... ${tracedPath.length} pontos adicionados.`
                        : tracedPath.length > 1
                          ? `Caminho atual com ${tracedPath.length} pontos. Posição: (${newRoomCoords?.x.toFixed(1)}, ${newRoomCoords?.y.toFixed(1)})`
                          : `Sem caminho definido. Posição: (${newRoomCoords?.x.toFixed(1)}, ${newRoomCoords?.y.toFixed(1)})`
                      }
                    </p>
                    {tracedPath.length > 0 && (
                      <div className="mt-2 text-xs text-blue-600">
                        Pontos: {tracedPath.map((p) => `(${p[0].toFixed(0)},${p[1].toFixed(0)})`).join(' → ')}
                      </div>
                    )}
                  </div>
                  
                  {/* Botões de controle */}
                  <div className="flex gap-2">
                    {!isTracingPath ? (
                      <>
                        <button
                          type="button"
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center gap-2"
                          onClick={() => { setIsTracingPath(true); }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                          Editar Caminho
                        </button>
                        <button
                          type="button"
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
                          onClick={() => { setTracedPath([]); setNewRoomCoords({ x: roomToEdit.x, y: roomToEdit.y }); }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remover Caminho
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
                          disabled={tracedPath.length === 0}
                          onClick={() => setTracedPath((prev) => prev.slice(0, -1))}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remover Último
                        </button>
                        
                        <button
                          type="button"
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
                          disabled={tracedPath.length < 2}
                          onClick={() => setIsTracingPath(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Finalizar Edição
                        </button>
                        
                        <button
                          type="button"
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2"
                          onClick={() => { 
                            setIsTracingPath(false); 
                            setTracedPath((roomToEdit.path || []) as Array<[number, number]>); 
                            setNewRoomCoords({ x: roomToEdit.x, y: roomToEdit.y }); 
                          }}
                        >
                          <X className="w-4 h-4" />
                          Cancelar Edição
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Dicas de uso */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">💡 Dicas de Edição:</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Clique em "Editar Caminho" para modificar a rota existente</li>
                      <li>• Clique no mapa para adicionar novos pontos sequenciais</li>
                      <li>• Use "Remover Último" para corrigir pontos errados</li>
                      <li>• "Remover Caminho" apaga toda a rota existente</li>
                      <li>• "Cancelar Edição" restaura o caminho original</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex">

        {/* Container do Mapa */}
        <div className="flex-1 relative overflow-hidden">
          {/* Controles de Zoom */}
          <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
            <button
              onClick={zoomIn}
              className="bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
              title="Zoom In"
            >
              <Plus className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={zoomOut}
              className="bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
              title="Reset View"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-md text-xs text-gray-600">
              {(zoom * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="w-full h-full">
          <svg
            className={`w-full h-full border border-gray-300 rounded-lg shadow-lg bg-white ${
              isDragging ? 'cursor-grabbing' : 
              isTracingPath || waitingForClick ? 'cursor-crosshair' : 'cursor-grab'
            }`}
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            onClick={handleMapClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }}
          >
            {/* Grupo principal com transformações de zoom e pan */}
            <g transform={`scale(${zoom}) translate(${pan.x / zoom}, ${pan.y / zoom})`}>
            {/* Imagem do mapa como fundo */}
            <image
              href="/mapa/mapa.png"
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid slice"
            />

            {/* Renderizar caminhos e pontos existentes */}
            {rooms.map((room) => (
              <g key={room.id}>
                {/* Renderizar caminho se existir */}
                {room.path && room.path.length > 1 && (
                  <g>
                    {/* Linha do caminho */}
                    <polyline
                      points={room.path.map(point => `${point[0]},${point[1]}`).join(' ')}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth={0.4 / zoom}
                      strokeDasharray={`${0.8 / zoom} ${0.8 / zoom}`}
                      className="opacity-70"
                    />
                    {/* Pontos intermediários do caminho */}
                    {room.path.slice(0, -1).map((point, index) => (
                      <circle
                        key={`path-${room.id}-${index}`}
                        cx={point[0]}
                        cy={point[1]}
                        r={1.0 / zoom}
                        fill="#10B981"
                        className="opacity-60"
                      />
                    ))}
                    {/* Seta indicando direção no final do caminho */}
                    {room.path.length > 1 && (
                      <polygon
                        points={`${room.x-0.8},${room.y-1.2} ${room.x+0.8},${room.y-1.2} ${room.x},${room.y-0.4}`}
                        fill="#10B981"
                        className="opacity-80"
                      />
                    )}
                  </g>
                )}
                {/* Círculo do ponto de destino */}
                <circle
                  cx={room.x}
                  cy={room.y}
                  r={1.8 / zoom}
                  fill="#3B82F6"
                  stroke="#1E40AF"
                  strokeWidth={0.3 / zoom}
                  className="hover:fill-blue-700 transition-colors cursor-pointer"
                  onClick={(e) => handleRoomClick(room, e)}
                />
                {/* Label do ponto */}
                <text
                  x={room.x}
                  y={room.y - 3.5}
                  textAnchor="middle"
                  className="fill-gray-700 text-xs font-medium pointer-events-none"
                  fontSize={2.2 / zoom}
                >
                  {room.name}
                </text>
                {/* Informações adicionais em hover */}
                <title>
                  {room.name} - {room.description}
                  {room.path && ` (Caminho com ${room.path.length} pontos)`}
                </title>
              </g>
            ))}
            {/* Renderizar caminho sendo traçado manualmente */}
            {isTracingPath && tracedPath.length > 0 && (
              <g>
                <polyline
                  points={tracedPath.map(point => `${point[0]},${point[1]}`).join(' ')}
                  fill="none"
                  stroke="#F59E42"
                  strokeWidth={0.6 / zoom}
                  strokeDasharray={`${1.2 / zoom} ${1.2 / zoom}`}
                  className="opacity-80"
                />
                {tracedPath.map((point, idx) => (
                  <circle
                    key={`trace-${idx}`}
                    cx={point[0]}
                    cy={point[1]}
                    r={1.2 / zoom}
                    fill="#F59E42"
                    className="opacity-80"
                  />
                ))}
              </g>
            )}

            {/* Loading overlay */}
            {loading && (
              <g>
                <rect x="0" y="0" width="100" height="100" fill="rgba(255,255,255,0.7)" />
                <text x="50" y="50" textAnchor="middle" className="fill-gray-600" fontSize="3">
                  Carregando pontos...
                </text>
              </g>
            )}
            </g>
          </svg>
        </div>
      </div>

      {/* Modal de detalhes da sala */}
      {showRoomDetails && selectedRoom && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Detalhes do Ponto
                </h2>
                <button 
                  onClick={() => setShowRoomDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Nome */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-lg text-blue-900 mb-1">{selectedRoom.name}</h3>
                  <p className="text-sm text-blue-700">
                    📍 Posição: ({selectedRoom.x.toFixed(1)}, {selectedRoom.y.toFixed(1)})
                  </p>
                </div>
                
                {/* Informações principais */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Capacidade</p>
                      <p className="font-medium">{selectedRoom.capacity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Hash className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Andar</p>
                      <p className="font-medium">{selectedRoom.floor}°</p>
                    </div>
                  </div>
                </div>
                
                {/* Descrição */}
                {selectedRoom.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Descrição</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedRoom.description}
                    </p>
                  </div>
                )}
                
                {/* Tipo e Prédio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Tipo</h4>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {selectedRoom.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Prédio</p>
                      <p className="font-medium text-sm">{selectedRoom.building}</p>
                    </div>
                  </div>
                </div>
                
                {/* Informações do caminho */}
                {selectedRoom.path && selectedRoom.path.length > 1 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      🛤️ Caminho Disponível
                    </h4>
                    <p className="text-sm text-green-700">
                      Rota com {selectedRoom.path.length} pontos de navegação
                    </p>
                    <div className="mt-2 text-xs text-green-600">
                      Pontos: {selectedRoom.path.map((p) => `(${p[0].toFixed(0)},${p[1].toFixed(0)})`).join(' → ')}
                    </div>
                  </div>
                )}
                
                {/* Amenidades */}
                {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Comodidades</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedRoom.amenities.map((amenity, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Datas */}
                {selectedRoom.createdAt && (
                  <div className="text-xs text-gray-500 border-t pt-3">
                    <p>Criado em: {new Date(selectedRoom.createdAt).toLocaleDateString('pt-BR')}</p>
                    {selectedRoom.updatedAt && (
                      <p>Atualizado em: {new Date(selectedRoom.updatedAt).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Botão de fechar */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowRoomDetails(false)}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

export default SimpleMap;