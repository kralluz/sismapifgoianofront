                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Room, CreateRoomRequest, Project, CreateProjectRequest } from '../../types';
import MapSidebar from './MapSidebar';
import MapCanvas from './MapCanvas';
import RoomDetailsModal from './RoomDetailsModal';
import ProjectForm from './ProjectForm';

interface RoomWithProjects extends Room {
  projects?: Project[];
}

const SimpleMap: React.FC = () => {
  // Estados principais
  const [rooms, setRooms] = useState<RoomWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Estados de modais
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormRoomId, setProjectFormRoomId] = useState<number | null>(null);

  // Estados de interação com o mapa
  const [isTracingPath, setIsTracingPath] = useState(false);
  const [tracedPath, setTracedPath] = useState<Array<[number, number]>>([]);
  const [tempRoomPosition, setTempRoomPosition] = useState<{ x: number; y: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

  // Estados para pan e zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panAtDragStart, setPanAtDragStart] = useState({ x: 0, y: 0 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);

  // Garantir token de desenvolvimento
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

  // Usar useCallback para estabilizar a função loadRooms
  const loadRooms = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const roomsData = await api.getRooms();
      // TODO: Carregar projetos para cada sala
      setRooms(roomsData);
    } catch (err) {
      setError('Erro ao carregar salas do mapa');
    } finally {
      setLoading(false);
    }
  }, []); // Array vazio = função nunca muda

  // Carregar salas - executa apenas uma vez na montagem
  useEffect(() => {
    loadRooms();
  }, [loadRooms]); // Seguro pois loadRooms é estável (useCallback)

  // Limpar mensagens
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handlers do mapa
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging || hasMouseMoved) return;
    
    if (isTracingPath) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      
      // Coordenadas do clique relativas ao SVG
      const svgX = ((e.clientX - rect.left) / rect.width) * 100;
      const svgY = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Aplicar transformação inversa do zoom e pan
      const x = (svgX - pan.x) / zoom;
      const y = (svgY - pan.y) / zoom;
      
      // Restringir às dimensões válidas (0-100)
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));
      
      setTracedPath((prev) => [...prev, [clampedX, clampedY]]);
      setTempRoomPosition({ x: clampedX, y: clampedY });
    }
  };

  const handleRoomClick = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoom(room);
    setShowRoomDetails(true);
  };

  const handleCreateRoom = async (
    data: any,
    path: Array<[number, number]>,
    position: { x: number; y: number }
  ) => {
    try {
      const roomData: CreateRoomRequest = {
        name: data.name,
        description: data.description || `Sala ${data.name}`,
        type: data.type,
        capacity: data.capacity,
        building: data.building,
        x: position.x,
        y: position.y,
        path: path
      };

      await api.createRoom(roomData);
      setSuccessMessage(`Sala "${data.name}" criada com sucesso!`);
      setTracedPath([]);
      setTempRoomPosition(null);
      setIsTracingPath(false);
      await loadRooms();
    } catch (err) {
      setError('Erro ao criar sala');
      throw err;
    }
  };

  // Handlers de CRUD de sala
  const handleDeleteRoom = async (room: Room) => {
    if (!confirm(`Tem certeza que deseja excluir a sala "${room.name}"?`)) return;
    
    try {
      await api.deleteRoom(room.id.toString());
      setSuccessMessage(`Sala "${room.name}" excluída com sucesso!`);
      await loadRooms();
    } catch (err) {
      setError('Erro ao excluir sala');
    }
  };

  // Handlers de CRUD de projeto
  const handleCreateProject = async (data: CreateProjectRequest) => {
    try {
      await api.createProject(data);
      setSuccessMessage('Projeto criado com sucesso!');
      await loadRooms();
      setShowProjectForm(false);
      setProjectFormRoomId(null);
    } catch (err) {
      setError('Erro ao criar projeto');
      throw err;
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${project.title}"?`)) return;
    
    try {
      await api.deleteProject(project.id.toString());
      setSuccessMessage('Projeto excluído com sucesso!');
      await loadRooms();
    } catch (err) {
      setError('Erro ao excluir projeto');
    }
  };

  // Funções de pan e zoom
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Permitir pan com botão direito ou com Shift pressionado
    if (e.button === 2 || e.shiftKey || !isTracingPath) {
      e.preventDefault();
      setIsDragging(true);
      setHasMouseMoved(false);
      // Armazenar posição inicial em pixels de tela E o pan inicial
      const startPos = { x: e.clientX, y: e.clientY };
      const startPan = { x: pan.x, y: pan.y };
      setDragStart(startPos);
      setPanAtDragStart(startPan);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    // Converter coordenadas de tela para SVG para cursor position
    const svgX = ((e.clientX - rect.left) / rect.width) * 100;
    const svgY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Atualizar posição do cursor quando estiver traçando
    if (isTracingPath && !isDragging) {
      // Aplicar transformação inversa do zoom e pan
      const x = (svgX - pan.x) / zoom;
      const y = (svgY - pan.y) / zoom;
      
      // Restringir às dimensões válidas
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));
      
      setCursorPosition({ x: clampedX, y: clampedY });
      return;
    }
    
    if (!isDragging) return;
    
    setHasMouseMoved(true);
    
    // Calcular delta em PIXELS desde o início do drag
    const deltaPixelsX = e.clientX - dragStart.x;
    const deltaPixelsY = e.clientY - dragStart.y;
    
    // Converter pixels para unidades do viewBox SVG
    // ViewBox é 0-100, então precisamos normalizar
    // Fator de sensibilidade: reduzir para tornar o movimento mais suave
    const SENSITIVITY = 0.5; // Reduz o movimento pela metade
    
    const deltaSvgX = ((deltaPixelsX / rect.width) * 100 * SENSITIVITY) / zoom;
    const deltaSvgY = ((deltaPixelsY / rect.height) * 100 * SENSITIVITY) / zoom;
    
    // Aplicar o delta ao PAN INICIAL
    const newPan = {
      x: panAtDragStart.x + deltaSvgX,
      y: panAtDragStart.y + deltaSvgY
    };
    
    setPan(newPan);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => setHasMouseMoved(false), 50);
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  const zoomIn = () => setZoom(prev => Math.min(5, prev * 1.1));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev / 1.1));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="h-screen w-full bg-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <MapSidebar
        rooms={rooms}
        loading={loading}
        sidebarMinimized={sidebarMinimized}
        setSidebarMinimized={setSidebarMinimized}
        onRoomSelect={(room) => {
          setSelectedRoom(room);
          setShowRoomDetails(true);
        }}
        onRoomEdit={(_room) => {
          // TODO: Implementar edição
        }}
        onRoomDelete={handleDeleteRoom}
        onProjectCreate={(roomId) => {
          setProjectFormRoomId(roomId);
          setShowProjectForm(true);
        }}
        onProjectEdit={(_project) => {
          // TODO: Implementar edição de projeto
        }}
        onProjectDelete={handleDeleteProject}
        isTracingPath={isTracingPath}
        onStartTracing={() => setIsTracingPath(true)}
        onStopTracing={() => {
          setIsTracingPath(false);
          setTracedPath([]);
          setTempRoomPosition(null);
        }}
        tracedPath={tracedPath}
        roomPosition={tempRoomPosition}
        onCreateRoom={handleCreateRoom}
      />

      {/* Canvas do Mapa */}
      <div className="flex-1 flex flex-col">
        <MapCanvas
          rooms={rooms}
          loading={loading}
          zoom={zoom}
          pan={pan}
          isDragging={isDragging}
          hasMouseMoved={hasMouseMoved}
          isTracingPath={isTracingPath}
          waitingForClick={false}
          tracedPath={tracedPath}
          newRoomCoords={tempRoomPosition}
          cursorPosition={cursorPosition}
          successMessage={successMessage}
          error={error}
          onMapClick={handleMapClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onRoomClick={handleRoomClick}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={resetView}
          onCloseSuccess={() => setSuccessMessage(null)}
          onCloseError={() => setError(null)}
        />
      </div>

      {/* Modal de Detalhes da Sala */}
      {showRoomDetails && selectedRoom && (
        <RoomDetailsModal
          room={selectedRoom}
          onClose={() => setShowRoomDetails(false)}
        />
      )}

      {/* Modal de Criar Projeto */}
      {showProjectForm && projectFormRoomId && (
        <ProjectForm
          roomId={projectFormRoomId}
          roomName={rooms.find(r => r.id === projectFormRoomId)?.name || ''}
          onSubmit={handleCreateProject}
          onCancel={() => {
            setShowProjectForm(false);
            setProjectFormRoomId(null);
          }}
        />
      )}
    </div>
  );
};

export default SimpleMap;
