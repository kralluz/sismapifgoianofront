import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/AuthContext";
import { api } from "../services/api";
import type {
  Room,
  CreateRoomRequest,
  Project,
  CreateProjectRequest,
} from "../types";
import MapSidebar from "./MapComponents/MapSidebar";
import RoomDetailsModal from "./MapComponents/RoomDetailsModal";
import ProjectForm from "./MapComponents/ProjectForm";
import institutoLogo from "../assets/intitutoLogo.png";

interface RoomWithProjects extends Room {
  projects?: Project[];
}

const NewMap: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);

  // Estados principais
  const [rooms, setRooms] = useState<RoomWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Estados de modais
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormRoomId, setProjectFormRoomId] = useState<number | null>(
    null
  );

  // Estados de interação com o mapa
  const [isTracingPath, setIsTracingPath] = useState(false);
  const [tracedPath, setTracedPath] = useState<Array<[number, number]>>([]);
  const [tempRoomPosition, setTempRoomPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Estados de pan e zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panAtDragStart, setPanAtDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  // Função para carregar salas (useCallback para evitar re-criação)
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const roomsData = await api.getRooms();
      setRooms(roomsData);
    } catch (err) {
      setError("Erro ao carregar salas do mapa");
    } finally {
      setLoading(false);
    }
  }, []); // Array vazio = função estável, nunca muda

  // Carregar salas na montagem
  useEffect(() => {
    loadRooms();
  }, [loadRooms]); // Agora pode incluir loadRooms com segurança (useCallback garante estabilidade)

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

  // Configurar wheel listener com { passive: false } para evitar warning
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  // Handlers do mapa
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Se arrastou, não adiciona ponto
    if (hasDragged) {
      setHasDragged(false);
      return;
    }

    if (isDragging) return;

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
        path: path,
      };

      await api.createRoom(roomData);
      setSuccessMessage(`Sala "${data.name}" criada com sucesso!`);
      setTracedPath([]);
      setTempRoomPosition(null);
      setIsTracingPath(false);
      await loadRooms();
    } catch (err) {
      setError("Erro ao criar sala");
      throw err;
    }
  };

  // Handlers de CRUD de sala
  const handleDeleteRoom = async (room: Room) => {
    if (!confirm(`Tem certeza que deseja excluir a sala "${room.name}"?`))
      return;

    try {
      await api.deleteRoom(room.id.toString());
      setSuccessMessage(`Sala "${room.name}" excluída com sucesso!`);
      await loadRooms();
    } catch (err) {
      setError("Erro ao excluir sala");
    }
  };

  // Handlers de CRUD de projeto
  const handleCreateProject = async (data: CreateProjectRequest) => {
    try {
      await api.createProject(data);
      setSuccessMessage("Projeto criado com sucesso!");
      await loadRooms();
      setShowProjectForm(false);
      setProjectFormRoomId(null);
    } catch (err) {
      setError("Erro ao criar projeto");
      throw err;
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (
      !confirm(`Tem certeza que deseja excluir o projeto "${project.title}"?`)
    )
      return;

    try {
      await api.deleteProject(project.id.toString());
      setSuccessMessage("Projeto excluído com sucesso!");
      await loadRooms();
    } catch (err) {
      setError("Erro ao excluir projeto");
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanAtDragStart({ x: pan.x, y: pan.y });
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

    // Calcular delta em PIXELS desde o início do drag
    const deltaPixelsX = e.clientX - dragStart.x;
    const deltaPixelsY = e.clientY - dragStart.y;

    // Marcar como arrastado se moveu mais de 5 pixels
    if (Math.abs(deltaPixelsX) > 5 || Math.abs(deltaPixelsY) > 5) {
      setHasDragged(true);
    }

    // Converter pixels para unidades do viewBox SVG mantendo sensibilidade constante
    const deltaSvgX = (deltaPixelsX / rect.width) * 100;
    const deltaSvgY = (deltaPixelsY / rect.height) * 100;

    // Aplicar o delta ao PAN INICIAL
    const newPan = {
      x: panAtDragStart.x + deltaSvgX,
      y: panAtDragStart.y + deltaSvgY,
    };
    setPan(newPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    // Ocultar cursor virtual quando sair da área do mapa
    if (isTracingPath) {
      setCursorPosition(null);
    }
  };

  const zoomIn = () => setZoom((prev) => Math.min(5, prev * 1.1));
  const zoomOut = () => setZoom((prev) => Math.max(0.5, prev / 1.1));
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
        onProjectSelect={(projectId, room) => {
          setSelectedProjectId(projectId);
          setSelectedRoom(room);
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
      <div className="flex-1 flex flex-col relative">
        {/* Logo / Botão Sair - Topo Direito */}
        {user ? (
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        ) : (
          <img
            src={institutoLogo}
            alt="Logo Instituto"
            onDoubleClick={() => navigate("/login")}
            className="absolute top-4 right-4 z-50 h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            title="Duplo clique para fazer login"
          />
        )}

        {/* Mensagens de Notificação */}
        {successMessage && (
          <div className="absolute top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <span className="text-sm font-medium">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-white/80 hover:text-white"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="absolute top-20 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white/80 hover:text-white"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Dica de navegação durante traçamento */}
        {isTracingPath && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
            💡 Dica: Use{" "}
            <kbd className="bg-blue-600 px-1.5 py-0.5 rounded mx-1">Shift</kbd>{" "}
            + arrastar ou{" "}
            <kbd className="bg-blue-600 px-1.5 py-0.5 rounded mx-1">
              botão direito
            </kbd>{" "}
            para mover o mapa
          </div>
        )}

        {/* Controles de Zoom - Canto Inferior Direito */}
        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
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
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <button
            onClick={resetView}
            className="bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
            title="Reset View"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-md text-xs text-gray-600 text-center">
            {(zoom * 100).toFixed(0)}%
          </div>
        </div>

        {/* Info Debug */}
        <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur border border-gray-300 rounded-lg px-4 py-3 shadow-md text-xs font-mono">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-500">Salas:</span>
            <span className="text-gray-800 font-semibold">{rooms.length}</span>
            <span className="text-gray-500">Zoom:</span>
            <span className="text-gray-800 font-semibold">
              {zoom.toFixed(2)}
            </span>
            <span className="text-gray-500">Pan X:</span>
            <span className="text-gray-800 font-semibold">
              {pan.x.toFixed(2)}
            </span>
            <span className="text-gray-500">Pan Y:</span>
            <span className="text-gray-800 font-semibold">
              {pan.y.toFixed(2)}
            </span>
            <span className="text-gray-500">Dragging:</span>
            <span
              className={
                isDragging ? "text-green-600 font-semibold" : "text-gray-400"
              }
            >
              {isDragging ? "SIM" : "não"}
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          className={`absolute inset-0 w-full h-full border border-gray-300 rounded-lg shadow-lg bg-white ${
            isDragging
              ? "cursor-grabbing"
              : isTracingPath
              ? "cursor-none"
              : "cursor-grab"
          }`}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleMapClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: "none" }}
        >
          {/* Grupo principal com transformações de zoom e pan */}
          <g 
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            style={{ 
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
          >
            {/* Imagem do mapa como fundo */}
            <image
              href="/mapa/mapa.jpeg"
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid slice"
            />

            {/* Grid de referência (opcional) */}
            <g opacity="0.2">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                <React.Fragment key={val}>
                  <line
                    x1={val}
                    y1="0"
                    x2={val}
                    y2="100"
                    stroke="#999"
                    strokeWidth={0.2 / zoom}
                  />
                  <line
                    x1="0"
                    y1={val}
                    x2="100"
                    y2={val}
                    stroke="#999"
                    strokeWidth={0.2 / zoom}
                  />
                </React.Fragment>
              ))}
            </g>

            {/* Renderizar salas da API */}
            {rooms.map((room) => (
              <g key={room.id}>
                {/* Renderizar caminho apenas se um projeto dessa sala estiver selecionado */}
                {room.path && room.path.length > 0 && selectedProjectId && room.projects?.some(p => p.id === selectedProjectId) && (
                  <g>
                    {/* Linha do caminho */}
                    <polyline
                      points={room.path
                        .map((point) => `${point[0]},${point[1]}`)
                        .join(" ")}
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
                        r={0.5 / zoom}
                        fill="#10B981"
                        className="opacity-60"
                      />
                    ))}
                  </g>
                )}
                {/* Círculo do ponto de destino */}
                <circle
                  cx={room.x}
                  cy={room.y}
                  r={0.8 / zoom}
                  fill="#3B82F6"
                  stroke="#1E40AF"
                  strokeWidth={0.15 / zoom}
                  className="hover:fill-blue-700 transition-colors cursor-pointer"
                  onClick={(e) => handleRoomClick(room, e)}
                />
                {/* Label do ponto com borda branca para melhor legibilidade */}
                <text
                  x={room.x}
                  y={room.y - 2.2}
                  textAnchor="middle"
                  className="pointer-events-none"
                  fontSize={`${1.8 / zoom}px`}
                  style={{
                    fontSize: `${1.8 / zoom}px`,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "600",
                    fill: "#1F2937",
                    stroke: "#FFFFFF",
                    strokeWidth: `${0.5 / zoom}px`,
                    paintOrder: "stroke fill",
                  }}
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
                  points={tracedPath
                    .map((point) => `${point[0]},${point[1]}`)
                    .join(" ")}
                  fill="none"
                  stroke="#F59E42"
                  strokeWidth={0.6 / zoom}
                  strokeDasharray={`${1.2 / zoom} ${1.2 / zoom}`}
                  className="opacity-80"
                />
                {tracedPath.map((point, idx) => (
                  <g key={`trace-${idx}`}>
                    <circle
                      cx={point[0]}
                      cy={point[1]}
                      r={1.5 / zoom}
                      fill="#F59E42"
                      stroke="#D97706"
                      strokeWidth={0.3 / zoom}
                      className="opacity-90"
                    />
                    {/* Número do ponto */}
                    <text
                      x={point[0]}
                      y={point[1] - 1.8 / zoom}
                      textAnchor="middle"
                      className="pointer-events-none"
                      fontSize={`${1.5 / zoom}px`}
                      style={{
                        fontSize: `${1.5 / zoom}px`,
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "bold",
                        fill: "#D97706",
                        stroke: "#FFFFFF",
                        strokeWidth: `${0.4 / zoom}px`,
                        paintOrder: "stroke fill",
                      }}
                    >
                      {idx + 1}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Preview do cursor para o próximo ponto */}
            {isTracingPath && cursorPosition && (
              <g className="pointer-events-none">
                {/* Círculo externo pulsante */}
                <circle
                  cx={cursorPosition.x}
                  cy={cursorPosition.y}
                  r={2.5 / zoom}
                  fill="none"
                  stroke="#F59E42"
                  strokeWidth={0.4 / zoom}
                  className="opacity-50"
                >
                  <animate
                    attributeName="r"
                    values={`${2.5 / zoom};${3.5 / zoom};${2.5 / zoom}`}
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0.2;0.5"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Círculo interno do cursor */}
                <circle
                  cx={cursorPosition.x}
                  cy={cursorPosition.y}
                  r={1.2 / zoom}
                  fill="#F59E42"
                  stroke="#D97706"
                  strokeWidth={0.3 / zoom}
                  className="opacity-70"
                />
                {/* Linhas de mira */}
                <line
                  x1={cursorPosition.x - 3 / zoom}
                  y1={cursorPosition.y}
                  x2={cursorPosition.x + 3 / zoom}
                  y2={cursorPosition.y}
                  stroke="#D97706"
                  strokeWidth={0.2 / zoom}
                  className="opacity-60"
                />
                <line
                  x1={cursorPosition.x}
                  y1={cursorPosition.y - 3 / zoom}
                  x2={cursorPosition.x}
                  y2={cursorPosition.y + 3 / zoom}
                  stroke="#D97706"
                  strokeWidth={0.2 / zoom}
                  className="opacity-60"
                />
                {/* Linha de conexão com o último ponto */}
                {tracedPath.length > 0 && (
                  <line
                    x1={tracedPath[tracedPath.length - 1][0]}
                    y1={tracedPath[tracedPath.length - 1][1]}
                    x2={cursorPosition.x}
                    y2={cursorPosition.y}
                    stroke="#F59E42"
                    strokeWidth={0.4 / zoom}
                    strokeDasharray={`${0.8 / zoom} ${0.8 / zoom}`}
                    className="opacity-40"
                  />
                )}
              </g>
            )}

            {/* Loading overlay */}
            {loading && (
              <g>
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  fill="rgba(255,255,255,0.7)"
                />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  className="fill-gray-600"
                  fontSize="3"
                >
                  Carregando pontos...
                </text>
              </g>
            )}

            {/* Ponto central de referência (removido - substituído pelas salas) */}
          </g>
        </svg>
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
          roomName={rooms.find((r) => r.id === projectFormRoomId)?.name || ""}
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

export default NewMap;
