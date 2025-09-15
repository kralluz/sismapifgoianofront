import React, { useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';
import type { Room, PathPoint } from '../../types';
import { Route } from 'lucide-react';
import type { UseMapInteractionReturn } from '../../hooks/useMapInteraction';

interface InteractiveMapSVGProps {
  rooms: Room[];
  selectedRoom: Room | null;
  showPath: boolean;
  displayPathPoints: PathPoint[];
  isEditMode: boolean;
  isCreatingPath: boolean;
  isPlacingUserPath: boolean;
  tempPathPoints: { x: number; y: number }[];
  userPathPoints: { x: number; y: number }[];
  editingRoom: Room | null;
  mapInteraction: UseMapInteractionReturn;
  onMapClick: (e: MouseEvent<SVGSVGElement>) => void;
  onRoomClick: (room: Room) => void;
  onRemoveTempPoint: (index: number) => void;
  onRemoveUserPoint: (index: number) => void;
  onEditRoom: (room: Room) => void;
  validateCurrentPath: (points: { x: number; y: number }[]) => {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
  onFinalizePath: () => void;
  onClearPath: () => void;
  onCancelPath: () => void;
}

const InteractiveMapSVG: React.FC<InteractiveMapSVGProps> = ({
  rooms,
  selectedRoom,
  showPath,
  displayPathPoints,
  isEditMode,
  isCreatingPath,
  isPlacingUserPath,
  tempPathPoints,
  userPathPoints,
  editingRoom,
  mapInteraction,
  onMapClick,
  onRoomClick,
  onRemoveTempPoint,
  onRemoveUserPoint,
  onEditRoom,
  validateCurrentPath,
  onFinalizePath,
  onClearPath,
  onCancelPath,
}) => {
  const mapRef = useRef<SVGSVGElement | null>(null);

  // Configurar event listener para zoom com scroll
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const handleWheel = (e: WheelEvent) => {
      mapInteraction.handleWheel(e);
    };

    mapElement.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      mapElement.removeEventListener('wheel', handleWheel);
    };
  }, [mapInteraction]);

  const getRoomColor = (room: Room, isSelected: boolean) => {
    if (isSelected) return '#ef4444';
    const colors: Record<string, string> = {
      classroom: '#3b82f6',
      lab: '#8b5cf6',
      library: '#10b981',
      auditorium: '#f59e0b',
      restaurant: '#f97316',
      office: '#6b7280',
    };
    return colors[room.type] || '#3b82f6';
  };

  return (
    <div className="flex-1 relative bg-gray-100 overflow-hidden" style={{ minHeight: '60vh' }}>
      <svg
        ref={mapRef}
        className={`w-full h-full select-none ${
          isEditMode
            ? 'cursor-crosshair'
            : mapInteraction.isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        onClick={onMapClick}
        onMouseDown={mapInteraction.handleMouseDown}
        onMouseMove={mapInteraction.handleMouseMove}
        onMouseUp={mapInteraction.handleMouseUp}
        onMouseLeave={mapInteraction.handleMouseUp}
        style={{
          transform: `scale(${mapInteraction.zoom}) translate(${mapInteraction.pan.x / mapInteraction.zoom}px, ${
            mapInteraction.pan.y / mapInteraction.zoom
          }px)`,
        }}
      >
        {/* Imagem do mapa como fundo */}
        <image
          href="/mapa/mapa.png"
          x="0"
          y="0"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid meet"
        />

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
                    onRemoveTempPoint(index);
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
                      onRemoveUserPoint(index);
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
            <g key={room.id} className={isEditMode ? 'cursor-pointer' : ''}>
              <circle
                cx={room.x}
                cy={room.y}
                r={isSelected || isEditing ? '3.5' : '2.5'}
                fill={getRoomColor(room, isSelected || isEditing)}
                stroke="white"
                strokeWidth="0.8"
                className={`${
                  isEditMode
                    ? 'cursor-pointer hover:scale-125'
                    : 'cursor-pointer hover:scale-110'
                } transition-all duration-200`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRoomClick(room);
                }}
                style={{
                  filter:
                    isSelected || isEditing
                      ? 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.8))'
                      : 'none',
                  strokeDasharray: isEditing ? '2,1' : 'none',
                }}
              />
              <text
                x={room.x}
                y={room.y - 4.5}
                fontSize="1.8"
                textAnchor="middle"
                fill="#1f2937"
                className="font-semibold pointer-events-none select-none"
                style={{
                  filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.8))',
                }}
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
                    onEditRoom(room);
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Controles de criação de caminho */}
      {isCreatingPath && (
        <div className="absolute bottom-4 right-4 bg-orange-500 text-white p-4 rounded-lg mb-2 shadow-lg max-w-xs">
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
                Último ponto: (
                {tempPathPoints[tempPathPoints.length - 1].x.toFixed(1)},{' '}
                {tempPathPoints[tempPathPoints.length - 1].y.toFixed(1)})
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
                    <div
                      key={index}
                      className="text-xs text-red-200 bg-red-600/50 p-1 rounded"
                    >
                      ⚠️ {error}
                    </div>
                  ))}
                  {validation.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="text-xs text-yellow-200 bg-yellow-600/50 p-1 rounded"
                    >
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
              onClick={onFinalizePath}
              disabled={tempPathPoints.length < 2}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-xs font-medium transition-colors"
              title="Finalizar caminho personalizado"
            >
              Finalizar
            </button>
            <button
              onClick={onClearPath}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
              title="Limpar todos os pontos"
            >
              Limpar
            </button>
            <button
              onClick={onCancelPath}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Controles de navegação removidos (agora renderizados em `CampusMap.tsx`) */}

      {/* Indicador de zoom - Estilo moderno */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-700 shadow-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-medium">Zoom:</span>
          <span className="text-blue-600 font-semibold">{(mapInteraction.zoom * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMapSVG;