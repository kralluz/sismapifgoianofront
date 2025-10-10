import React, { useState } from 'react';
import type { Room, UpdateRoomRequest } from '../../types';
import { X, MapPin, Users, Building, Layers, FileText, Save } from 'lucide-react';

interface EditRoomModalProps {
  room: Room;
  onSubmit: (id: number, data: UpdateRoomRequest) => Promise<void>;
  onCancel: () => void;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({
  room,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<UpdateRoomRequest>({
    name: room.name,
    description: room.description,
    type: room.type,
    capacity: room.capacity,
    building: room.building,
    floor: room.floor,
    amenities: room.amenities || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [amenityInput, setAmenityInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!formData.name || formData.name.trim().length < 2) {
      setErrorMessage('O nome da sala deve ter pelo menos 2 caracteres');
      return;
    }

    if (!formData.capacity || formData.capacity < 1) {
      setErrorMessage('A capacidade deve ser pelo menos 1');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(room.id, formData);
      onCancel();
    } catch (error) {
      console.error('Erro ao atualizar sala:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao atualizar sala');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !formData.amenities?.includes(amenityInput.trim())) {
      setFormData({
        ...formData,
        amenities: [...(formData.amenities || []), amenityInput.trim()],
      });
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities?.filter((a) => a !== amenity) || [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Editar Sala</h2>
              <p className="text-sm text-gray-500 mt-1">
                Atualize as informações da sala
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome da Sala */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Sala *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Laboratório 1, Sala 201, etc."
                  />
                </div>
              </div>

              {/* Tipo de Sala */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Sala *
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="classroom">Sala de Aula</option>
                    <option value="lab">Laboratório</option>
                    <option value="library">Biblioteca</option>
                    <option value="auditorium">Auditório</option>
                    <option value="restaurant">Restaurante</option>
                    <option value="office">Escritório</option>
                  </select>
                </div>
              </div>

              {/* Capacidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidade *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 30"
                    min="1"
                  />
                </div>
              </div>

              {/* Prédio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prédio *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: A, B, C, etc."
                  />
                </div>
              </div>

              {/* Andar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Andar *
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 1, 2, 3, etc."
                    min="0"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Descreva a sala..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Recursos/Amenities */}
              <div className="md:col-span-2">
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite um recurso e pressione Enter"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities?.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Info sobre coordenadas */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Nota:</strong> As coordenadas (x: {room.x.toFixed(2)}, y: {room.y.toFixed(2)}) e o caminho não podem ser alterados por aqui. Para movê-la no mapa, será necessário excluir e recriar a sala.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;
