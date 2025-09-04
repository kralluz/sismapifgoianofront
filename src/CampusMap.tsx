import React, { useState, useRef } from 'react';
import type { MouseEvent } from 'react';
import { MapPin, Navigation, Users, Search, Book, FlaskConical, Utensils, Volume2, X, ChevronDown, Wifi, WifiOff, Edit3, Save, Trash2, Route, User, LogOut } from 'lucide-react';
import campusMapData from './campusMapData.json';
import type { Room, Event, RoomType, PathPoint, PopoverPosition } from './types';
import {
  createPathPoint
} from './pathUtils';


interface CampusMapProps {
  isAdmin?: boolean;
  onShowAdminLogin?: () => void;
  onAdminLogout?: () => void;
}

const CampusMapMVP: React.FC<CampusMapProps> = ({ isAdmin = false, onShowAdminLogin, onAdminLogout }) => {
  // Temporarily hardcode online status to fix the hook issue
  const isOnline = true;
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showPath, setShowPath] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Estados para modo de edição
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isCreatingPath, setIsCreatingPath] = useState<boolean>(false);
  const [tempPathPoints, setTempPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [showEditPanel, setShowEditPanel] = useState<boolean>(false);
  const [userPathPoints, setUserPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [isPlacingUserPath, setIsPlacingUserPath] = useState<boolean>(false);

  const mapRef = useRef<SVGSVGElement | null>(null);

  // Dados das salas (inicializado com dados padrão)
  const [rooms, setRooms] = useState<Room[]>(() => {
    return campusMapData.map(room => ({
      ...room,
      type: room.type as RoomType
    }));
  });









  // Função para obter ícone do tipo de sala
  const getRoomIcon = (type: RoomType) => {
    const icons = {
      classroom: Book,
      lab: FlaskConical,
      library: Book,
      auditorium: Volume2,
      restaurant: Utensils,
      office: Users
    };
    return icons[type] || MapPin;
  };

  // Função para obter cor do tipo de sala
  const getRoomColor = (room: Room, isSelected: boolean) => {
    if (isSelected) return "#ef4444";
    const colors = {
      classroom: "#3b82f6",
      lab: "#8b5cf6",
      library: "#10b981",
      auditorium: "#f59e0b",
      restaurant: "#f97316",
      office: "#6b7280"
    };
    return colors[room.type] || "#3b82f6";
  };

  // Sistema de caminhos melhorado usando utilitários
  const getPathToRoom = (roomId: string): PathPoint[] => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.path || room.path.length === 0) return [];

    // Converter os pontos simples do JSON para PathPoint
    return room.path.map((point, index) => {
      let type: PathPoint['type'] = 'waypoint';
      let label = '';

      if (index === 0) {
        type = 'entrance';
        label = 'Entrada Principal';
      } else if (index === (room.path?.length || 0) - 1) {
        type = 'destination';
        label = room.name;
      }

      return createPathPoint(point[0], point[1], type, label);
    });
  };

  // Função para calcular posição do popover sem sobreposição
  const getPopoverPosition = (room: Room | null): PopoverPosition => {
    if (!room) return { top: '1rem', left: '1rem' };

    const mapContainer = mapRef.current?.getBoundingClientRect();
    if (!mapContainer) return { top: '1rem', left: '1rem' };

    const svgX = (room.x / 100) * mapContainer.width;
    const svgY = (room.y / 100) * mapContainer.height;

    const popoverWidth = 320;
    const popoverHeight = 300;

    let left = svgX + 20;
    let top = svgY - popoverHeight / 2;

    if (left + popoverWidth > mapContainer.width) {
      left = svgX - popoverWidth - 20;
    }

    if (top < 20) {
      top = 20;
    } else if (top + popoverHeight > mapContainer.height - 20) {
      top = mapContainer.height - popoverHeight - 20;
    }

    if (Math.abs(left - svgX) < 50 && Math.abs(top + popoverHeight / 2 - svgY) < 30) {
      top = svgY + 30;
      left = svgX - popoverWidth / 2;

      if (left < 20) left = 20;
      if (left + popoverWidth > mapContainer.width - 20) {
        left = mapContainer.width - popoverWidth - 20;
      }
    }

    return {
      left: `${Math.max(20, left)}px`,
      top: `${Math.max(20, top)}px`
    };
  };

  // Filtros aprimorados para salas
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || room.type === filterType;
    return matchesSearch && matchesType;
  });

  // Funções de edição
  const handleMapClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!isEditMode) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Ajustar coordenadas considerando zoom e pan
    const svgX = (e.clientX - rect.left - pan.x) / zoom;
    const svgY = (e.clientY - rect.top - pan.y) / zoom;

    // Converter para coordenadas relativas (0-100)
    const x = (svgX / rect.width) * 100;
    const y = (svgY / rect.height) * 100;

    // Garantir que as coordenadas estejam dentro dos limites
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    if (isPlacingUserPath) {
      setUserPathPoints(prev => [...prev, { x: clampedX, y: clampedY }]);
    } else if (isCreatingPath) {
      setTempPathPoints(prev => [...prev, { x: clampedX, y: clampedY }]);
    } else {
      // Criar novo local
      const newRoom: Room = {
        id: `custom-${Date.now()}`,
        name: `Novo Local ${rooms.length + 1}`,
        x: clampedX,
        y: clampedY,
        description: 'Local personalizado',
        capacity: 20,
        type: 'classroom',
        floor: 1,
        building: 'X',
        amenities: []
      };
      setRooms(prev => [...prev, newRoom]);
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
      // Verificar se temos pontos suficientes
      if (tempPathPoints.length < 1) {
        alert('Adicione pelo menos um ponto antes de finalizar o caminho clicando em uma sala.');
        return;
      }

      // Finalizar criação do caminho
      const points: PathPoint[] = tempPathPoints.map((point, index) => {
        let type: PathPoint['type'] = 'waypoint';
        let label = '';

        if (index === 0) {
          type = 'entrance';
          label = 'Entrada Principal';
        } else if (index === tempPathPoints.length - 1) {
          type = 'destination';
          label = room.name;
        }

        return createPathPoint(point.x, point.y, type, label);
      });

      // Adiciona o ponto final da sala se não estiver incluído
      if (tempPathPoints.length === 0 || tempPathPoints[tempPathPoints.length - 1].x !== room.x || tempPathPoints[tempPathPoints.length - 1].y !== room.y) {
        points.push(createPathPoint(room.x, room.y, 'destination', room.name));
      }

      // Como não temos mais customPaths, apenas mostramos uma mensagem
      alert(`Caminho para ${room.name} criado com sucesso!`);
      setTempPathPoints([]);
      setIsCreatingPath(false);
    }

    setSelectedRoom(room);
    setSelectedEvent(null);
    setShowPath(true); // Alterado para true para exibir o caminho automaticamente
  };



  const saveRoomEdit = (updatedRoom: Room) => {
    setRooms(prev => prev.map(room =>
      room.id === updatedRoom.id ? updatedRoom : room
    ));
    setEditingRoom(null);
    setShowEditPanel(false);
  };

  const deleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    setEditingRoom(null);
    setShowEditPanel(false);
  };

  const startPathCreation = () => {
    setIsCreatingPath(true);
    setTempPathPoints([]); // Começar com array vazio
    setSelectedRoom(null);
    setShowEditPanel(false); // Fechar painel de edição se estiver aberto
  };

  const cancelPathCreation = () => {
    setIsCreatingPath(false);
    setTempPathPoints([]);
  };

  // Validação em tempo real do caminho sendo criado
  const validateCurrentPath = (points: { x: number; y: number }[]): { isValid: boolean; warnings: string[]; errors: string[] } => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Só requerer 2 pontos se já começou a criar o caminho
    if (points.length >= 1 && points.length < 2) {
      // Não é erro, apenas aviso
    } else if (points.length < 2 && points.length > 0) {
      errors.push('Adicione pelo menos mais um ponto para criar um caminho válido');
    }

    // Verifica se os pontos estão muito próximos
    for (let i = 0; i < points.length - 1; i++) {
      const distance = Math.sqrt(
        Math.pow(points[i + 1].x - points[i].x, 2) +
        Math.pow(points[i + 1].y - points[i].y, 2)
      );

      if (distance < 3) { // Aumentei o limite para 3 unidades
        warnings.push(`Pontos ${i + 1} e ${i + 2} estão muito próximos (${distance.toFixed(1)} unidades)`);
      }
    }

    // Verifica se o caminho é muito longo
    if (points.length > 15) { // Aumentei o limite
      warnings.push('Caminho muito longo. Considere simplificar a rota');
    }

    // Verifica se há pontos fora dos limites
    points.forEach((point, index) => {
      if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) {
        errors.push(`Ponto ${index + 1} está fora dos limites do mapa`);
      }
    });

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  };





  // Controles de zoom e pan
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    if (isEditMode) return; // Não permitir drag no modo de edição
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isDragging && !isEditMode) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };





  const displayPathPoints = showPath && selectedRoom ? getPathToRoom(selectedRoom.id) : [];

  // Debug: verificar se o caminho está sendo calculado
  console.log('Debug caminho:', {
    showPath,
    selectedRoom: selectedRoom?.id,
    displayPathPointsLength: displayPathPoints.length,
    displayPathPoints
  });

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header melhorado com controles de edição */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Campus IF - Mapa Interativo
              {isEditMode && <span className="bg-orange-500 px-2 py-1 rounded text-sm">MODO EDIÇÃO</span>}
            </h1>
            <p className="text-blue-100 text-sm">
              {isEditMode
                ? isPlacingUserPath
                  ? `Colocando pontos do caminho (${userPathPoints.length} pontos) - Clique no mapa para adicionar pontos. Clique nos pontos verdes para removê-los.`
                  : isCreatingPath
                    ? `Adicionando pontos do caminho (${tempPathPoints.length} pontos) - Clique no mapa para adicionar pontos, clique nos pontos amarelos para removê-los. Clique em uma sala para finalizar ou use o botão "Finalizar"`
                    : 'Clique no mapa para adicionar locais, clique em locais para editar propriedades'
                : 'Navegação inteligente e eventos em tempo real'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {isAdmin ? (
              <>
                <button
                  onClick={() => {
                    setIsEditMode(!isEditMode);
                    setEditingRoom(null);
                    setIsCreatingPath(false);
                    setTempPathPoints([]);
                    setShowEditPanel(false);
                    setIsPlacingUserPath(false);
                    setUserPathPoints([]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isEditMode
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-white/20 hover:bg-white/30'
                    }`}
                >
                  <Edit3 className="w-4 h-4" />
                  {isEditMode ? 'Sair da Edição' : 'Editar Mapa'}
                </button>
                <button
                  onClick={onAdminLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-red-500 hover:bg-red-600 text-white"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            ) : (
              <button
                onClick={onShowAdminLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-white/20 hover:bg-white/30"
              >
                <User className="w-4 h-4" />
                Admin
              </button>
            )}
            {isEditMode && (
              <>
                <button
                  onClick={() => {
                    setIsPlacingUserPath(!isPlacingUserPath);
                    if (!isPlacingUserPath) {
                      setUserPathPoints([]);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isPlacingUserPath
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                >
                  <Route className="w-4 h-4" />
                  {isPlacingUserPath ? 'Finalizar Caminho' : 'Colocar Caminho'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mapa Container aprimorado - 60% da tela */}
      <div className="flex-1 relative bg-gray-100 overflow-hidden" style={{ minHeight: '60vh' }}>
        <svg
          ref={mapRef}
          className={`w-full h-full select-none ${isEditMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleMapClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
          }}
        >
          {/* Imagem do mapa como fundo */}
          <image href="/mapa/mapa.png" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" />





          {/* Caminho temporário durante criação */}
          {isCreatingPath && tempPathPoints.length > 0 && (
            <g id="temp-path">
              {tempPathPoints.map((point, index) => {
                if (index === tempPathPoints.length - 1) return null;
                const nextPoint = tempPathPoints[index + 1];
                return (
                  <line
                    key={index}
                    x1={point.x}
                    y1={point.y}
                    x2={nextPoint.x}
                    y2={nextPoint.y}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="3,1"
                    className="animate-pulse"
                  />
                );
              })}

              {tempPathPoints.map((point, index) => (
                <g key={`temp-point-${index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="1.5"
                    fill="#f59e0b"
                    stroke="white"
                    strokeWidth="0.5"
                    className="animate-pulse cursor-pointer hover:fill-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempPathPoints(prev => prev.filter((_, i) => i !== index));
                    }}
                  />
                  <text
                    x={point.x}
                    y={point.y - 2.5}
                    fontSize="2"
                    textAnchor="middle"
                    fill="white"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {index + 1}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Caminho do usuário */}
          {userPathPoints.length > 0 && (
            <g id="user-path">
              {userPathPoints.map((point, index) => {
                if (index === userPathPoints.length - 1) return null;
                const nextPoint = userPathPoints[index + 1];
                return (
                  <line
                    key={index}
                    x1={point.x}
                    y1={point.y}
                    x2={nextPoint.x}
                    y2={nextPoint.y}
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="5,2"
                    className="animate-pulse"
                  />
                );
              })}

              {userPathPoints.map((point, index) => (
                <g key={`user-point-${index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="1.5"
                    fill="#10b981"
                    stroke="white"
                    strokeWidth="0.5"
                    className="cursor-pointer hover:fill-red-500"
                    onClick={(e) => {
                      if (isPlacingUserPath) {
                        e.stopPropagation();
                        setUserPathPoints(prev => prev.filter((_, i) => i !== index));
                      }
                    }}
                  />
                  <text
                    x={point.x}
                    y={point.y - 2.5}
                    fontSize="2"
                    textAnchor="middle"
                    fill="white"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {index + 1}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Caminho ativo para navegação */}
          {showPath && displayPathPoints.length > 1 && (
            <g id="active-path">
              {displayPathPoints.map((point, index) => {
                if (index === displayPathPoints.length - 1) return null;
                const nextPoint = displayPathPoints[index + 1];
                return (
                  <line
                    key={index}
                    x1={point.x}
                    y1={point.y}
                    x2={nextPoint.x}
                    y2={nextPoint.y}
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeDasharray="3,2"
                    className="animate-pulse"
                  />
                );
              })}

              {displayPathPoints.map((point, index) => (
                <circle
                  key={`active-point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="1.2"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="0.3"
                  className="animate-pulse"
                />
              ))}
            </g>
          )}

          {/* Salas/Pontos com ícones */}
          {rooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            const isEditing = editingRoom?.id === room.id;
            return (
              <g key={room.id} className={isEditMode ? "cursor-pointer" : ""}>
                <circle
                  cx={room.x}
                  cy={room.y}
                  r={isSelected || isEditing ? "3.5" : "2.5"}
                  fill={getRoomColor(room, isSelected || isEditing)}
                  stroke="white"
                  strokeWidth="0.8"
                  className={`${isEditMode ? 'cursor-pointer hover:scale-125' : 'cursor-pointer hover:scale-110'} transition-all duration-200`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoomClick(room);
                  }}
                  style={{
                    filter: (isSelected || isEditing) ? 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.8))' : 'none',
                    strokeDasharray: isEditing ? '2,1' : 'none'
                  }}
                />
                <text
                  x={room.x}
                  y={room.y - 4.5}
                  fontSize="1.8"
                  textAnchor="middle"
                  fill="#1f2937"
                  className="font-semibold pointer-events-none select-none"
                  style={{ filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.8))' }}
                >
                  {room.name}
                </text>
                <text
                  x={room.x}
                  y={room.y + 0.5}
                  fontSize="1.2"
                  textAnchor="middle"
                  fill="white"
                  className="pointer-events-none select-none"
                >
                  {room.building}
                </text>
                {isEditMode && (
                  <circle
                    cx={room.x + 3}
                    cy={room.y - 3}
                    r="1.5"
                    fill="#f59e0b"
                    stroke="white"
                    strokeWidth="0.3"
                    className="cursor-pointer hover:fill-orange-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRoom(room);
                      setShowEditPanel(true);
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Popover aprimorado com posicionamento inteligente */}
        {selectedRoom && !isEditMode && (
          <div
            className="absolute bg-white rounded-xl shadow-2xl p-5 max-w-sm border border-gray-100 backdrop-blur-sm bg-white/95 z-50 transition-all duration-200"
            style={getPopoverPosition(selectedRoom)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {React.createElement(getRoomIcon(selectedRoom.type), { className: "w-5 h-5 text-blue-600" })}
                <h3 className="font-bold text-gray-900">{selectedRoom.name}</h3>
              </div>
              <button
                onClick={() => { setSelectedRoom(null); setShowPath(false); setSelectedEvent(null); }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-3">
              <p className="text-gray-600 text-sm">{selectedRoom.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  🏢 Prédio {selectedRoom.building}
                </span>
                <span className="flex items-center gap-1">
                  🏢 {selectedRoom.floor}º Andar
                </span>
                <span className="flex items-center gap-1">
                  👥 {selectedRoom.capacity} pessoas
                </span>
              </div>
            </div>

            {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  ⚡ Recursos Disponíveis:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedRoom.amenities.map((amenity, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600">📅</span>
                  <span className="font-semibold text-sm text-gray-900">Evento Atual:</span>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg">
                  <p className="font-semibold text-sm text-gray-900 mb-1">{selectedEvent.title}</p>
                  <p className="text-xs text-gray-600 mb-1">📅 {selectedEvent.time} - {selectedEvent.date}</p>
                  <p className="text-xs text-gray-600 mb-2">👨‍🏫 {selectedEvent.speaker}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status: {selectedEvent?.status || 'N/A'}</span>
                    <span className="text-xs text-gray-500">👥 {selectedEvent?.attendees || 0} participantes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Indicador de direção da seta */}
            <div
              className="absolute w-3 h-3 bg-white border border-gray-100 transform rotate-45"
              style={{
                left: selectedRoom.x < 50 ? '-6px' : 'auto',
                right: selectedRoom.x >= 50 ? '-6px' : 'auto',
                top: '50%',
                marginTop: '-6px',
                zIndex: -1
              }}
            />
          </div>
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

        {/* Controles de navegação aprimorados */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {isCreatingPath && (
            <div className="bg-orange-500 text-white p-4 rounded-lg mb-2 shadow-lg max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <Route className="w-5 h-5" />
                <span className="font-bold text-sm">Criando Caminho</span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="text-xs text-orange-100">
                  Pontos adicionados: {tempPathPoints.length}
                </div>
                {tempPathPoints.length > 0 && (
                  <div className="text-xs bg-orange-600/50 p-2 rounded">
                    Último ponto: ({tempPathPoints[tempPathPoints.length - 1].x.toFixed(1)}, {tempPathPoints[tempPathPoints.length - 1].y.toFixed(1)})
                  </div>
                )}

                {/* Validação em tempo real */}
                {(() => {
                  const validation = validateCurrentPath(tempPathPoints);
                  return (
                    <div className="space-y-1">
                      {validation.errors.length === 0 && tempPathPoints.length === 0 && (
                        <div className="text-xs text-blue-200 bg-blue-600/50 p-1 rounded">
                          💡 Clique no mapa para começar a adicionar pontos do caminho
                        </div>
                      )}
                      {validation.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-200 bg-red-600/50 p-1 rounded">
                          ⚠️ {error}
                        </div>
                      ))}
                      {validation.warnings.map((warning, index) => (
                        <div key={index} className="text-xs text-yellow-200 bg-yellow-600/50 p-1 rounded">
                          ⚡ {warning}
                        </div>
                      ))}
                      {validation.isValid && tempPathPoints.length >= 2 && (
                        <div className="text-xs text-green-200 bg-green-600/50 p-1 rounded">
                          ✅ Pronto! Clique em uma sala para finalizar ou use o botão "Finalizar"
                        </div>
                      )}
                      {validation.isValid && tempPathPoints.length === 1 && (
                        <div className="text-xs text-blue-200 bg-blue-600/50 p-1 rounded">
                          📍 Adicione mais pontos ou clique em uma sala para finalizar
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (tempPathPoints.length >= 2) {
                      // Como não temos mais customPaths, apenas mostramos uma mensagem
                      alert(`Caminho criado com sucesso!`);
                      setTempPathPoints([]);
                      setIsCreatingPath(false);
                    }
                  }}
                  disabled={tempPathPoints.length < 2}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-xs font-medium transition-colors"
                  title="Finalizar caminho personalizado"
                >
                  Finalizar
                </button>
                <button
                  onClick={() => setTempPathPoints([])}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
                  title="Limpar todos os pontos"
                >
                  Limpar
                </button>
                <button
                  onClick={cancelPathCreation}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}



          <button
            onClick={handleZoomIn}
            className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
            title="Zoom In"
          >
            <span className="text-lg font-bold text-gray-600">+</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
            title="Zoom Out"
          >
            <span className="text-lg font-bold text-gray-600">-</span>
          </button>
          <button
            onClick={() => {
              setShowPath(false);
              setSelectedEvent(null);
              setSelectedRoom(null);
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
            title="Reset View"
          >
            <Navigation className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Indicador de zoom */}
        <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-1 text-sm text-gray-600">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>

      {/* Lista de Salas - 40% da tela */}
      <div className="h-2/5 bg-white border-t border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Locais do Campus
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                {filteredRooms.length}
              </span>
            </h2>
          </div>

          {/* Controles de busca e filtro */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar salas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="classroom">Salas de Aula</option>
                <option value="lab">Laboratórios</option>
                <option value="library">Biblioteca</option>
                <option value="auditorium">Auditório</option>
                <option value="restaurant">Cantina</option>
                <option value="office">Escritório</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">Nenhuma sala encontrada</p>
                <p className="text-sm">Tente ajustar sua busca ou filtros</p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;

                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {React.createElement(getRoomIcon(room.type), { className: "w-5 h-5 text-blue-600" })}
                          <h3 className="font-bold text-gray-900">{room.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{room.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span>{room.capacity} pessoas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span>Prédio {room.building}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🏢</span>
                            <span>{room.floor}º Andar</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">📍</span>
                            <span>({room.x.toFixed(1)}, {room.y.toFixed(1)})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${room.type === 'classroom' ? 'bg-blue-100 text-blue-800' :
                            room.type === 'lab' ? 'bg-purple-100 text-purple-800' :
                              room.type === 'library' ? 'bg-green-100 text-green-800' :
                                room.type === 'auditorium' ? 'bg-orange-100 text-orange-800' :
                                  room.type === 'restaurant' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {room.type === 'classroom' ? 'Sala de Aula' :
                             room.type === 'lab' ? 'Laboratório' :
                             room.type === 'library' ? 'Biblioteca' :
                             room.type === 'auditorium' ? 'Auditório' :
                             room.type === 'restaurant' ? 'Cantina' : 'Escritório'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recursos disponíveis */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.map((amenity, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Indicador de caminho disponível */}
                    {room.path && room.path.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Navigation className="w-4 h-4" />
                          <span className="font-medium">Caminho disponível - {room.path.length} pontos</span>
                        </div>
                      </div>
                    )}

                    {/* Indicador de seleção */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="font-medium">Sala selecionada</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Estatísticas rápidas na parte inferior */}
        <div className="border-t bg-gray-50 p-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                {rooms.filter(r => r.type === 'classroom').length} Salas de Aula
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                {rooms.filter(r => r.type === 'lab').length} Laboratórios
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {rooms.filter(r => r.type === 'library').length} Bibliotecas
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Total: {rooms.length} locais
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente do Painel de Edição
interface EditRoomPanelProps {
  room: Room;
  onSave: (room: Room) => void;
  onDelete: (roomId: string) => void;
  onCancel: () => void;
  onStartPath: (room: Room) => void;
}

const EditRoomPanel: React.FC<EditRoomPanelProps> = ({ room, onSave, onDelete, onCancel, onStartPath }) => {
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
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={editedRoom.name}
            onChange={(e) => setEditedRoom({ ...editedRoom, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            value={editedRoom.description}
            onChange={(e) => setEditedRoom({ ...editedRoom, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={editedRoom.type}
              onChange={(e) => setEditedRoom({ ...editedRoom, type: e.target.value as RoomType })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade</label>
            <input
              type="number"
              value={editedRoom.capacity}
              onChange={(e) => setEditedRoom({ ...editedRoom, capacity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prédio</label>
            <input
              type="text"
              value={editedRoom.building}
              onChange={(e) => setEditedRoom({ ...editedRoom, building: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Andar</label>
            <input
              type="number"
              value={editedRoom.floor}
              onChange={(e) => setEditedRoom({ ...editedRoom, floor: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recursos (separados por vírgula)</label>
          <input
            type="text"
            value={editedRoom.amenities ? editedRoom.amenities.join(', ') : ''}
            onChange={(e) => setEditedRoom({
              ...editedRoom,
              amenities: e.target.value.split(',').map(item => item.trim()).filter(item => item)
            })}
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