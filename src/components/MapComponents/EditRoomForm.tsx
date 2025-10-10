import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Room } from '../../types';

interface RoomFormData {
  name: string;
  description: string;
  type: string;
  capacity: number;
  building: string;
  floor: number;
  amenities: string[];
}

interface EditRoomFormProps {
  room: Room;
  onComplete: () => void;
  onCancel: () => void;
  onStartTracing: () => void;
  onStopTracing: () => void;
  isTracingPath: boolean;
  tracedPath: Array<[number, number]>;
  roomPosition: { x: number; y: number } | null;
  onUpdateRoom: (id: number, data: RoomFormData, path: Array<[number, number]>, position: { x: number; y: number }) => Promise<void>;
}

const EditRoomForm: React.FC<EditRoomFormProps> = ({ 
  room,
  onComplete, 
  onCancel,
  onStartTracing,
  onStopTracing,
  tracedPath,
  roomPosition,
  onUpdateRoom,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomData, setRoomData] = useState<RoomFormData>({
    name: room.name,
    description: room.description,
    type: room.type,
    capacity: room.capacity,
    building: room.building,
    floor: room.floor,
    amenities: room.amenities || [],
  });

  const [amenityInput, setAmenityInput] = useState('');

  // Iniciar traçado automaticamente quando o componente montar
  useEffect(() => {
    onStartTracing();
    
    // Cleanup quando desmontar
    return () => {
      onStopTracing();
    };
  }, [onStartTracing, onStopTracing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se não traçou um novo caminho, usa o caminho existente
    const finalPath = tracedPath.length >= 2 
      ? tracedPath 
      : (room.path?.map(p => [p[0], p[1]] as [number, number]) || []);
    const finalPosition = roomPosition || { x: room.x, y: room.y };

    if (finalPath.length < 2) {
      alert('É necessário ter um caminho com pelo menos 2 pontos no mapa');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateRoom(room.id, roomData, finalPath, finalPosition);
      onComplete();
    } catch (error) {
      alert('Erro ao atualizar sala. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !roomData.amenities.includes(amenityInput.trim())) {
      setRoomData({
        ...roomData,
        amenities: [...roomData.amenities, amenityInput.trim()],
      });
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setRoomData({
      ...roomData,
      amenities: roomData.amenities.filter((a) => a !== amenity),
    });
  };

  // Determina quantos pontos usar para validação
  const effectivePathLength = tracedPath.length > 0 ? tracedPath.length : (room.path?.length || 0);
  const hasValidPath = effectivePathLength >= 2;

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar Sala</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 hover:bg-orange-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {tracedPath.length > 0 
            ? 'Clique no mapa para traçar uma nova rota'
            : 'Manter rota atual ou clique no mapa para traçar uma nova'}
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status da Rota */}
        <div className={`p-3 rounded-lg border ${
          hasValidPath ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              hasValidPath ? 'text-green-800' : 'text-amber-800'
            }`}>
              {tracedPath.length > 0 ? '🗺️ Nova rota traçada' : '📍 Rota atual mantida'}
            </span>
            <span className={`text-xs font-semibold ${
              hasValidPath ? 'text-green-700' : 'text-amber-700'
            }`}>
              {tracedPath.length > 0 ? `${tracedPath.length} pontos novos` : `${room.path?.length || 0} pontos originais`}
            </span>
          </div>
          {!hasValidPath && (
            <p className="text-xs text-amber-700 mt-1">
              ⚠️ Clique no mapa para adicionar pontos (mínimo 2)
            </p>
          )}
          {hasValidPath && (
            <p className="text-xs text-green-700 mt-1">
              ✓ Rota válida! {tracedPath.length > 0 ? 'Nova rota será salva.' : 'Mantendo rota original.'}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ex: Sala 101, Laboratório A"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={roomData.description}
            onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Descrição do local..."
          />
        </div>

        {/* Grid de Campos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={roomData.type}
              onChange={(e) => setRoomData({ ...roomData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidade *
            </label>
            <input
              type="number"
              required
              min={1}
              value={roomData.capacity}
              onChange={(e) => setRoomData({ ...roomData, capacity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prédio *
            </label>
            <input
              type="text"
              required
              value={roomData.building}
              onChange={(e) => setRoomData({ ...roomData, building: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ex: Bloco A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Andar *
            </label>
            <input
              type="number"
              required
              min={0}
              value={roomData.floor}
              onChange={(e) => setRoomData({ ...roomData, floor: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Recursos/Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recursos Disponíveis
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAmenity();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Digite um recurso e pressione Enter"
            />
            <button
              type="button"
              onClick={addAmenity}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {roomData.amenities.map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(amenity)}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
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
          disabled={!roomData.name.trim() || !hasValidPath || isSubmitting}
          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
};

export default EditRoomForm;
