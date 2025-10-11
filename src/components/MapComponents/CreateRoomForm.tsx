import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface RoomFormData {
  name: string;
  description: string;
}

interface CreateRoomFormProps {
  onComplete: () => void;
  onCancel: () => void;
  onStartTracing: () => void;
  onStopTracing: () => void;
  isTracingPath: boolean;
  tracedPath: Array<[number, number]>;
  roomPosition: { x: number; y: number } | null;
  onCreateRoom: (data: RoomFormData, path: Array<[number, number]>, position: { x: number; y: number }) => Promise<void>;
}

const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ 
  onComplete, 
  onCancel,
  onStartTracing,
  isTracingPath,
  tracedPath,
  roomPosition,
  onCreateRoom,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomData, setRoomData] = useState<RoomFormData>({
    name: '',
    description: '',
  });

  // Iniciar traçado automaticamente quando o componente montar
  useEffect(() => {
    onStartTracing();
  }, [onStartTracing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomPosition || tracedPath.length < 2) {
      alert('É necessário traçar um caminho com pelo menos 2 pontos no mapa');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateRoom(roomData, tracedPath, roomPosition);
      onComplete();
    } catch (error) {
      alert('Erro ao criar sala. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nova Sala</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Preencha os dados e clique no mapa para traçar a rota
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status da Rota */}
        <div className={`p-3 rounded-lg border ${
          tracedPath.length >= 2 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              tracedPath.length >= 2 ? 'text-green-800' : 'text-amber-800'
            }`}>
              {isTracingPath ? '🗺️ Traçando rota...' : '⏸️ Traçado pausado'}
            </span>
            <span className={`text-xs font-semibold ${
              tracedPath.length >= 2 ? 'text-green-700' : 'text-amber-700'
            }`}>
              {tracedPath.length} pontos
            </span>
          </div>
          {tracedPath.length < 2 && (
            <p className="text-xs text-amber-700 mt-1">
              ⚠️ Clique no mapa para adicionar pontos (mínimo 2)
            </p>
          )}
          {tracedPath.length >= 2 && (
            <p className="text-xs text-green-700 mt-1">
              ✓ Rota válida! Preencha os dados e salve.
            </p>
          )}
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Sala *
          </label>
          <input
            type="text"
            required
            value={roomData.name}
            onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Sala 101, Laboratório A"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição *
          </label>
          <textarea
            required
            value={roomData.description}
            onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
            rows={3}
            maxLength={500}
            style={{ resize: 'none' }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descrição do local... (máx. 500 caracteres)"
          />
          <p className="text-xs text-gray-500 mt-1">
            {roomData.description.length}/500 caracteres
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={!roomData.name.trim() || !roomData.description.trim() || tracedPath.length < 2 || isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Criando...' : 'Criar Sala'}
        </button>
      </div>
    </form>
  );
};

export default CreateRoomForm;
