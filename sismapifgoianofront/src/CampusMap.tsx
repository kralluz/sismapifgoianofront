import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Calendar, Clock, Users, Search, Filter, Zap, Book, FlaskConical, Utensils, Volume2, X, ChevronDown, Wifi, WifiOff, Edit3, Plus, Save, Trash2, Move, Route } from 'lucide-react';

const CampusMapMVP = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPath, setShowPath] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isOnline, setIsOnline] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Estados para modo de edição
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isCreatingPath, setIsCreatingPath] = useState(false);
  const [pathPoints, setPathPoints] = useState([]);
  const [tempPathPoints, setTempPathPoints] = useState([]);
  const [customRooms, setCustomRooms] = useState([]);
  const [customPaths, setCustomPaths] = useState([]);
  const [draggedRoom, setDraggedRoom] = useState(null);
  const [showEditPanel, setShowEditPanel] = useState(false);

  const mapRef = useRef(null);

  // Dados das salas (agora podem ser editados)
  const [rooms, setRooms] = useState([
    {
      id: 'sala-101',
      name: 'Sala 101',
      x: 25,
      y: 32,
      description: 'Sala de Aula - Teoria',
      capacity: 40,
      type: 'classroom',
      floor: 1,
      building: 'A',
      amenities: ['Projetor', 'Ar condicionado', 'Quadro inteligente'],
      isCustom: false
    },
    {
      id: 'lab-info-1',
      name: 'Lab Informática I',
      x: 68,
      y: 28,
      description: 'Laboratório de Programação',
      capacity: 20,
      type: 'lab',
      floor: 1,
      building: 'B',
      amenities: ['20 PCs', 'Projetor', 'Rede gigabit'],
      isCustom: false
    },
    {
      id: 'biblioteca',
      name: 'Biblioteca Central',
      x: 45,
      y: 65,
      description: 'Acervo e Estudos',
      capacity: 100,
      type: 'library',
      floor: 1,
      building: 'C',
      amenities: ['5000+ livros', 'Wi-Fi', 'Salas de estudo'],
      isCustom: false
    },
    {
      id: 'auditorio',
      name: 'Auditório Principal',
      x: 78,
      y: 72,
      description: 'Eventos e Palestras',
      capacity: 200,
      type: 'auditorium',
      floor: 1,
      building: 'D',
      amenities: ['Sistema de som', 'Projeção 4K', 'Ar condicionado'],
      isCustom: false
    },
    {
      id: 'cantina',
      name: 'Cantina Central',
      x: 18,
      y: 78,
      description: 'Alimentação',
      capacity: 80,
      type: 'restaurant',
      floor: 1,
      building: 'E',
      amenities: ['Refeitório', 'Lanchonete', 'Microondas'],
      isCustom: false
    }
  ]);

  // Eventos expandidos com mais variedade
  const events = [
    {
      id: 1,
      title: 'Palestra: O Futuro da IA',
      room: 'auditorio',
      time: '14:00 - 16:00',
      date: '26/08/2025',
      attendees: 150,
      type: 'palestra',
      status: 'confirmed',
      speaker: 'Dr. Ana Silva',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Programação em Python',
      room: 'lab-info-1',
      time: '08:00 - 10:00',
      date: '26/08/2025',
      attendees: 20,
      type: 'aula',
      status: 'ongoing',
      speaker: 'Prof. Carlos Santos',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Reunião Pedagógica',
      room: 'biblioteca',
      time: '10:00 - 12:00',
      date: '26/08/2025',
      attendees: 12,
      type: 'reuniao',
      status: 'confirmed',
      speaker: 'Coordenação',
      priority: 'medium'
    },
    {
      id: 4,
      title: 'Workshop: Realidade Virtual',
      room: 'biblioteca',
      time: '16:00 - 18:00',
      date: '26/08/2025',
      attendees: 25,
      type: 'workshop',
      status: 'confirmed',
      speaker: 'Tech Team',
      priority: 'high'
    }
  ];

  // Função para obter ícone do tipo de sala
  const getRoomIcon = (type) => {
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
  const getRoomColor = (room, isSelected) => {
    if (isSelected) return "#ef4444";
    if (room.isCustom) return "#8b5cf6";
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

  // Sistema de caminhos mais realista com múltiplas rotas
  const getPathToRoom = (roomId) => {
    // Primeiro verifica se existe um caminho customizado
    const customPath = customPaths.find(path => path.roomId === roomId);
    if (customPath) {
      return customPath.points;
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) return [];

    const entrance = { x: 10, y: 10 };
    const destination = { x: room.x, y: room.y };

    // Define pontos principais do sistema viário do campus
    const mainNodes = {
      entrance: { x: 10, y: 10 },
      centralHub: { x: 50, y: 50 },
      northGate: { x: 50, y: 15 },
      southGate: { x: 50, y: 85 },
      eastGate: { x: 85, y: 50 },
      westGate: { x: 15, y: 50 }
    };

    // Determina a melhor rota baseada na localização do destino
    let pathPointsArray = [entrance];

    // Conecta da entrada ao hub central passando pela via oeste
    pathPointsArray.push(mainNodes.westGate);
    pathPointsArray.push(mainNodes.centralHub);

    // Escolhe a rota baseada na localização do destino
    if (destination.x < 40 && destination.y < 50) {
      pathPointsArray.push(mainNodes.northGate);
    } else if (destination.x > 60 && destination.y < 50) {
      pathPointsArray.push(mainNodes.northGate);
      pathPointsArray.push(mainNodes.eastGate);
    } else if (destination.x > 60 && destination.y > 50) {
      pathPointsArray.push(mainNodes.eastGate);
    } else if (destination.x < 40 && destination.y > 50) {
      pathPointsArray.push(mainNodes.southGate);
    }

    // Adiciona pontos de aproximação ao destino
    pathPointsArray.push({ x: destination.x, y: destination.y - 3 });
    pathPointsArray.push(destination);

    return pathPointsArray;
  };

  // Função para calcular posição do popover sem sobreposição
  const getPopoverPosition = (room) => {
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

  // Filtros aprimorados
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rooms.find(r => r.id === event.room)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
    return matchesSearch && matchesType;
  });

  // Funções de edição
  const handleMapClick = (e) => {
    if (!isEditMode) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isCreatingPath) {
      setTempPathPoints(prev => [...prev, { x, y }]);
    } else {
      // Criar novo local
      const newRoom = {
        id: `custom-${Date.now()}`,
        name: `Novo Local ${rooms.length + 1}`,
        x,
        y,
        description: 'Local personalizado',
        capacity: 20,
        type: 'classroom',
        floor: 1,
        building: 'X',
        amenities: [],
        isCustom: true
      };
      setRooms(prev => [...prev, newRoom]);
      setEditingRoom(newRoom);
    }
  };

  const handleRoomClick = (room) => {
    if (isEditMode && !isCreatingPath) {
      setEditingRoom(room);
      setShowEditPanel(true);
      return;
    }

    if (isCreatingPath) {
      // Finalizar criação do caminho
      const pathId = `path-${Date.now()}`;
      const newPath = {
        id: pathId,
        roomId: room.id,
        points: [...tempPathPoints, { x: room.x, y: room.y }]
      };
      setCustomPaths(prev => [...prev, newPath]);
      setTempPathPoints([]);
      setIsCreatingPath(false);
      return;
    }

    setSelectedRoom(room);
    setSelectedEvent(null);
    setShowPath(false);
  };

  const handleEventClick = (event) => {
    const room = rooms.find(r => r.id === event.room);
    setSelectedEvent(event);
    setSelectedRoom(room);
    setShowPath(true);
  };

  const saveRoomEdit = (updatedRoom) => {
    setRooms(prev => prev.map(room =>
      room.id === updatedRoom.id ? updatedRoom : room
    ));
    setEditingRoom(null);
    setShowEditPanel(false);
  };

  const deleteRoom = (roomId) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    setCustomPaths(prev => prev.filter(path => path.roomId !== roomId));
    setEditingRoom(null);
    setShowEditPanel(false);
  };

  const startPathCreation = (room) => {
    setIsCreatingPath(true);
    setTempPathPoints([{ x: 10, y: 10 }]); // Começa da entrada
    setSelectedRoom(null);
  };

  const cancelPathCreation = () => {
    setIsCreatingPath(false);
    setTempPathPoints([]);
  };

  // Controles de zoom e pan
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  const handleMouseDown = (e) => {
    if (isEditMode) return; // Não permitir drag no modo de edição
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging && !isEditMode) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const getEventTypeColor = (type, status) => {
    const baseColors = {
      palestra: 'border-blue-200 bg-blue-50',
      aula: 'border-green-200 bg-green-50',
      reuniao: 'border-purple-200 bg-purple-50',
      laboratorio: 'border-orange-200 bg-orange-50',
      workshop: 'border-pink-200 bg-pink-50',
      estudo: 'border-gray-200 bg-gray-50'
    };

    if (status === 'ongoing') {
      return 'border-yellow-300 bg-yellow-100 animate-pulse';
    }

    return baseColors[type] || 'border-gray-200 bg-gray-50';
  };

  const getStatusBadge = (status) => {
    const badges = {
      ongoing: 'bg-green-500 text-white animate-pulse',
      confirmed: 'bg-blue-500 text-white',
      cancelled: 'bg-red-500 text-white'
    };
    const labels = {
      ongoing: 'Acontecendo',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const displayPathPoints = showPath && selectedRoom ? getPathToRoom(selectedRoom.id) : [];

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
                ? isCreatingPath
                  ? 'Clique no mapa para adicionar pontos do caminho, depois clique no destino'
                  : 'Clique no mapa para adicionar locais ou clique em um local existente para editar'
                : 'Navegação inteligente e eventos em tempo real'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <button
              onClick={() => {
                setIsEditMode(!isEditMode);
                setEditingRoom(null);
                setIsCreatingPath(false);
                setTempPathPoints([]);
                setShowEditPanel(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isEditMode
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-white/20 hover:bg-white/30'
                }`}
            >
              <Edit3 className="w-4 h-4" />
              {isEditMode ? 'Sair da Edição' : 'Editar Mapa'}
            </button>
          </div>
        </div>
      </div>

      {/* Mapa Container aprimorado - 60% da tela */}
      <div className="flex-1 relative bg-gradient-to-br from-green-100 to-emerald-200 overflow-hidden" style={{ minHeight: '60vh' }}>
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
          {/* Fundo do campus mais detalhado */}
          <defs>
            <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="#dcfce7" />
              <circle cx="1" cy="1" r="0.2" fill="#bbf7d0" opacity="0.5" />
              <circle cx="3" cy="3" r="0.2" fill="#bbf7d0" opacity="0.5" />
            </pattern>
            <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#f3f4f6", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#d1d5db", stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          <rect width="100" height="100" fill="url(#grass)" />

          {/* Sistema viário completo do campus */}
          <g id="road-system">
            {/* Via Principal Horizontal */}
            <rect x="5" y="48" width="90" height="4" fill="#6b7280" opacity="0.8" rx="2" />
            <rect x="5" y="49" width="90" height="2" fill="#9ca3af" opacity="0.6" rx="1" />

            {/* Via Principal Vertical */}
            <rect x="48" y="5" width="4" height="90" fill="#6b7280" opacity="0.8" rx="2" />
            <rect x="49" y="5" width="2" height="90" fill="#9ca3af" opacity="0.6" rx="1" />

            {/* Vias Secundárias */}
            <rect x="23" y="15" width="3" height="70" fill="#9ca3af" opacity="0.7" rx="1.5" />
            <rect x="24" y="15" width="1" height="70" fill="#d1d5db" opacity="0.5" rx="0.5" />

            <rect x="74" y="20" width="3" height="65" fill="#9ca3af" opacity="0.7" rx="1.5" />
            <rect x="75" y="20" width="1" height="65" fill="#d1d5db" opacity="0.5" rx="0.5" />

            <rect x="25" y="23" width="50" height="3" fill="#9ca3af" opacity="0.7" rx="1.5" />
            <rect x="25" y="24" width="50" height="1" fill="#d1d5db" opacity="0.5" rx="0.5" />

            <rect x="20" y="73" width="65" height="3" fill="#9ca3af" opacity="0.7" rx="1.5" />
            <rect x="20" y="74" width="65" height="1" fill="#d1d5db" opacity="0.5" rx="0.5" />
          </g>

          {/* Prédios com mais detalhes */}
          <g id="buildings">
            <rect x="15" y="20" width="25" height="25" fill="url(#buildingGrad)" stroke="#6b7280" strokeWidth="0.3" rx="1" />
            <text x="27.5" y="33" fontSize="2.5" textAnchor="middle" fill="#374151" className="font-bold">A</text>

            <rect x="60" y="15" width="25" height="35" fill="url(#buildingGrad)" stroke="#6b7280" strokeWidth="0.3" rx="1" />
            <text x="72.5" y="33" fontSize="2.5" textAnchor="middle" fill="#374151" className="font-bold">B</text>

            <rect x="35" y="55" width="30" height="25" fill="url(#buildingGrad)" stroke="#6b7280" strokeWidth="0.3" rx="1" />
            <text x="50" y="68" fontSize="2.5" textAnchor="middle" fill="#374151" className="font-bold">C</text>

            <rect x="70" y="60" width="20" height="25" fill="url(#buildingGrad)" stroke="#6b7280" strokeWidth="0.3" rx="1" />
            <text x="80" y="73" fontSize="2.5" textAnchor="middle" fill="#374151" className="font-bold">D</text>

            <rect x="10" y="70" width="20" height="15" fill="url(#buildingGrad)" stroke="#6b7280" strokeWidth="0.3" rx="1" />
            <text x="20" y="78" fontSize="2.5" textAnchor="middle" fill="#374151" className="font-bold">E</text>
          </g>

          {/* Entrada principal */}
          <g id="entrance">
            <rect x="7" y="7" width="6" height="6" fill="#ef4444" rx="1" stroke="white" strokeWidth="0.3" />
            <text x="10" y="10.5" fontSize="1.5" textAnchor="middle" fill="white" className="font-bold">🚪</text>
            <text x="16" y="11" fontSize="1.8" fill="#ef4444" className="font-bold">Entrada Principal</text>
          </g>

          {/* Caminhos customizados */}
          {customPaths.map((path, index) => (
            <g key={path.id} id={`custom-path-${index}`}>
              {path.points.map((point, pointIndex) => {
                if (pointIndex === path.points.length - 1) return null;
                const nextPoint = path.points[pointIndex + 1];
                return (
                  <line
                    key={pointIndex}
                    x1={point.x}
                    y1={point.y}
                    x2={nextPoint.x}
                    y2={nextPoint.y}
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                    opacity="0.8"
                  />
                );
              })}

              {path.points.map((point, pointIndex) => (
                <circle
                  key={`custom-point-${pointIndex}`}
                  cx={point.x}
                  cy={point.y}
                  r="1"
                  fill="#8b5cf6"
                  opacity="0.8"
                />
              ))}
            </g>
          ))}

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
                <circle
                  key={`temp-point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill="#f59e0b"
                  className="animate-pulse"
                />
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
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-sm text-gray-900">Evento Atual:</span>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg">
                  <p className="font-semibold text-sm text-gray-900 mb-1">{selectedEvent.title}</p>
                  <p className="text-xs text-gray-600 mb-1">📅 {selectedEvent.time} - {selectedEvent.date}</p>
                  <p className="text-xs text-gray-600 mb-2">👨‍🏫 {selectedEvent.speaker}</p>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(selectedEvent.status)}
                    <span className="text-xs text-gray-500">👥 {selectedEvent.attendees} participantes</span>
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
            <div className="bg-orange-500 text-white p-3 rounded-lg mb-2 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-4 h-4" />
                <span className="font-medium text-sm">Criando Caminho</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={cancelPathCreation}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
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

      {/* Lista de Eventos aprimorada - 40% da tela */}
      <div className="h-2/5 bg-white border-t border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Eventos de Hoje
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                {filteredEvents.length}
              </span>
            </h2>
          </div>

          {/* Controles de busca e filtro */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar eventos ou salas..."
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
                <option value="aula">Aulas</option>
                <option value="palestra">Palestras</option>
                <option value="reuniao">Reuniões</option>
                <option value="laboratorio">Laboratórios</option>
                <option value="workshop">Workshops</option>
                <option value="estudo">Estudos</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">Nenhum evento encontrado</p>
                <p className="text-sm">Tente ajustar sua busca ou filtros</p>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const room = rooms.find(r => r.id === event.room);
                const isSelected = selectedEvent?.id === event.id;

                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                      : `${getEventTypeColor(event.type, event.status)} hover:shadow-md`
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{event.title}</h3>
                          {event.priority === 'high' && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                              Alta Prioridade
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Por: {event.speaker}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{room?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span>{event.attendees} pessoas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {room && React.createElement(getRoomIcon(room.type), { className: "w-4 h-4 text-orange-500" })}
                            <span>Prédio {room?.building}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        {getStatusBadge(event.status)}
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${event.type === 'palestra' ? 'bg-blue-100 text-blue-800' :
                            event.type === 'aula' ? 'bg-green-100 text-green-800' :
                              event.type === 'reuniao' ? 'bg-purple-100 text-purple-800' :
                                event.type === 'laboratorio' ? 'bg-orange-100 text-orange-800' :
                                  event.type === 'workshop' ? 'bg-pink-100 text-pink-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {event.type}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barra de progresso para eventos em andamento */}
                    {event.status === 'ongoing' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Em andamento</span>
                          <span>45% concluído</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    )}

                    {/* Indicador de distância */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Navigation className="w-4 h-4" />
                          <span className="font-medium">Rota calculada - {Math.floor(Math.random() * 150 + 50)}m</span>
                          <span className="text-xs text-gray-500">~2 min caminhando</span>
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
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {events.filter(e => e.status === 'ongoing').length} Em andamento
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                {events.filter(e => e.status === 'confirmed').length} Confirmados
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                {events.filter(e => e.priority === 'high').length} Alta prioridade
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Última atualização: agora
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente do Painel de Edição
const EditRoomPanel = ({ room, onSave, onDelete, onCancel, onStartPath }) => {
  const [editedRoom, setEditedRoom] = useState({ ...room });

  const handleSubmit = (e) => {
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
            rows="2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={editedRoom.type}
              onChange={(e) => setEditedRoom({ ...editedRoom, type: e.target.value })}
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
              onChange={(e) => setEditedRoom({ ...editedRoom, capacity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
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
              maxLength="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Andar</label>
            <input
              type="number"
              value={editedRoom.floor}
              onChange={(e) => setEditedRoom({ ...editedRoom, floor: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
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

          {room.isCustom && (
            <button
              type="button"
              onClick={() => onDelete(room.id)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              title="Excluir local"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CampusMapMVP;