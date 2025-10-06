import React from 'react';
import type { Room } from '../../types';
import { Plus, X } from 'lucide-react';

interface MapCanvasProps {
  rooms: Room[];
  loading: boolean;
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  hasMouseMoved: boolean;
  isTracingPath: boolean;
  waitingForClick: boolean;
  tracedPath: Array<[number, number]>;
  newRoomCoords: { x: number; y: number } | null;
  cursorPosition?: { x: number; y: number } | null;
  successMessage: string | null;
  error: string | null;
  onMapClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent<SVGSVGElement>) => void;
  onRoomClick: (room: Room, e: React.MouseEvent) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onCloseSuccess: () => void;
  onCloseError: () => void;
}

const MapCanvas: React.FC<MapCanvasProps> = ({
  rooms,
  loading,
  zoom,
  pan,
  isDragging,
  isTracingPath,
  waitingForClick,
  tracedPath,
  cursorPosition,
  successMessage,
  error,
  onMapClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onRoomClick,
  onZoomIn,
  onZoomOut,
  onResetView,
  onCloseSuccess,
  onCloseError,
}) => {
  return (
    <div className="flex-1 relative h-full w-full overflow-hidden">
      {/* Mensagens de Notificação */}
      {successMessage && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={onCloseSuccess} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={onCloseError} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dica de navegação durante traçamento */}
      {isTracingPath && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          💡 Dica: Use <kbd className="bg-blue-600 px-1.5 py-0.5 rounded mx-1">Shift</kbd> + arrastar ou <kbd className="bg-blue-600 px-1.5 py-0.5 rounded mx-1">botão direito</kbd> para mover o mapa
        </div>
      )}

      {/* Controles de Zoom */}
      <div className="absolute top-2 sm:top-6 right-2 sm:right-6 z-10 flex flex-col gap-1 sm:gap-2">
        <button
          onClick={onZoomIn}
          className="bg-white border border-gray-300 rounded-lg p-1.5 sm:p-2 shadow-md hover:bg-gray-50 transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </button>
        <button
          onClick={onZoomOut}
          className="bg-white border border-gray-300 rounded-lg p-1.5 sm:p-2 shadow-md hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={onResetView}
          className="bg-white border border-gray-300 rounded-lg p-1.5 sm:p-2 shadow-md hover:bg-gray-50 transition-colors"
          title="Reset View"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <div className="bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 shadow-md text-xs text-gray-600">
          {(zoom * 100).toFixed(0)}%
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className={`absolute inset-0 w-full h-full border border-gray-300 rounded-lg shadow-lg bg-white ${
          isDragging ? 'cursor-grabbing' : 
          isTracingPath || waitingForClick ? 'cursor-crosshair' : 'cursor-grab'
        }`}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        onClick={onMapClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: 'none' }}
      >
        {/* Grupo principal com transformações de zoom e pan */}
        <g transform={`scale(${zoom}) translate(${pan.x / zoom}, ${pan.y / zoom})`}>
          {/* Imagem do mapa como fundo */}
          <image
            href="/mapa/mapa.jpeg"
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
                onClick={(e) => onRoomClick(room, e)}
              />
              {/* Label do ponto */}
              <text
                x={room.x}
                y={room.y - 2.8}
                textAnchor="middle"
                className="fill-gray-700 pointer-events-none"
                fontSize={`${2.5 / zoom}px`}
                style={{ 
                  fontSize: `${2.5 / zoom}px`, 
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: '500'
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
                points={tracedPath.map(point => `${point[0]},${point[1]}`).join(' ')}
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
                    y={point[1] - 2.5 / zoom}
                    textAnchor="middle"
                    className="fill-orange-600 pointer-events-none font-bold"
                    fontSize={`${2.5 / zoom}px`}
                    style={{ 
                      fontSize: `${2.5 / zoom}px`,
                      fontFamily: 'Arial, sans-serif'
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
              <rect x="0" y="0" width="100" height="100" fill="rgba(255,255,255,0.7)" />
              <text x="50" y="50" textAnchor="middle" className="fill-gray-600" fontSize="3">
                Carregando pontos...
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

export default MapCanvas;
