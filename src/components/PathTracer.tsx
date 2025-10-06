import React from 'react';
import { X } from 'lucide-react';

interface PathTracerProps {
  tracedPath: Array<[number, number]>;
  newRoomCoords: { x: number; y: number } | null;
  isTracingPath: boolean;
  onStartTracing: () => void;
  onRemoveLast: () => void;
  onFinishTracing: () => void;
  onCancelTracing: () => void;
  color?: 'orange' | 'blue';
}

export const PathTracer: React.FC<PathTracerProps> = ({
  tracedPath,
  newRoomCoords,
  isTracingPath,
  onStartTracing,
  onRemoveLast,
  onFinishTracing,
  onCancelTracing,
  color = 'orange'
}) => {
  const colorClasses = {
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      textLight: 'text-orange-700',
      textXs: 'text-orange-600',
      button: 'bg-orange-500 hover:bg-orange-600'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      textLight: 'text-blue-700',
      textXs: 'text-blue-600',
      button: 'bg-blue-500 hover:bg-blue-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <h4 className={`text-lg font-semibold ${colors.text} mb-3 flex items-center gap-2`}>
        🛤️ {color === 'orange' ? 'Traçar Caminho' : 'Editar Caminho'}
      </h4>
      
      <div className={`mb-4 p-3 bg-white rounded-lg border ${colors.border}`}>
        <p className={`text-sm ${colors.textLight}`}>
          {tracedPath.length === 0 
            ? `Clique no mapa para iniciar ${color === 'orange' ? 'o traçado do' : 'um novo'} caminho.`
            : newRoomCoords && !isTracingPath
              ? `Caminho finalizado com ${tracedPath.length} pontos. Posição final: (${newRoomCoords.x.toFixed(1)}, ${newRoomCoords.y.toFixed(1)})`
              : `${color === 'orange' ? 'Traçando' : 'Editando'} caminho... ${tracedPath.length} pontos adicionados.`
          }
        </p>
        {tracedPath.length > 0 && (
          <div className={`mt-2 text-xs ${colors.textXs}`}>
            Pontos: {tracedPath.map((p) => `(${p[0].toFixed(0)},${p[1].toFixed(0)})`).join(' → ')}
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        {!isTracingPath ? (
          <button
            type="button"
            className={`${colors.button} text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2`}
            onClick={onStartTracing}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            {color === 'orange' ? 'Iniciar Traçado' : 'Editar Caminho'}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
              disabled={tracedPath.length === 0}
              onClick={onRemoveLast}
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
              onClick={onFinishTracing}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Finalizar {color === 'orange' ? 'Traçado' : 'Edição'}
            </button>
            
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2"
              onClick={onCancelTracing}
            >
              <X className="w-4 h-4" />
              Cancelar {color === 'orange' ? 'Traçado' : 'Edição'}
            </button>
          </>
        )}
      </div>
      
      <div className={`mt-4 p-3 bg-white rounded-lg border ${colors.border}`}>
        <h5 className={`text-sm font-medium ${colors.text} mb-2`}>💡 Dicas de Uso:</h5>
        <ul className={`text-xs ${colors.textLight} space-y-1`}>
          <li>• Clique no mapa para adicionar pontos sequenciais ao caminho</li>
          <li>• O último ponto será a posição final da sala</li>
          <li>• Use "Remover Último" para corrigir pontos errados</li>
          <li>• Mínimo de 2 pontos para criar um caminho válido</li>
        </ul>
      </div>
    </div>
  );
};
