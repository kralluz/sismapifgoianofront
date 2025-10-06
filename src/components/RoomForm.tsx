import React from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface RoomFormProps {
  roomData: {
    name: string;
    description: string;
    type: string;
    capacity: number;
  };
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: any) => void;
  onCancel: () => void;
  isCreating: boolean;
  hasCoords: boolean;
  isEditMode?: boolean;
}

export const RoomForm: React.FC<RoomFormProps> = ({
  roomData,
  onSubmit,
  onChange,
  onCancel,
  isCreating,
  hasCoords,
  isEditMode = false
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        {isEditMode ? (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ) : (
          <Plus className="w-5 h-5 text-blue-600" />
        )}
        {isEditMode ? 'Editar Sala/Ponto' : 'Nova Sala/Ponto'}
      </h3>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Ponto *</label>
          <input 
            type="text" 
            required 
            value={roomData.name} 
            onChange={e => onChange({ ...roomData, name: e.target.value })} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Ex: Entrada Principal, Sala 101"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Descrição</label>
          <input 
            type="text" 
            value={roomData.description} 
            onChange={e => onChange({ ...roomData, description: e.target.value })} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Descrição opcional"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <select 
              value={roomData.type} 
              onChange={e => onChange({ ...roomData, type: e.target.value })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            <label className="block text-sm font-medium mb-2">Capacidade</label>
            <input 
              type="number" 
              min={1} 
              value={roomData.capacity} 
              onChange={e => onChange({ ...roomData, capacity: Number(e.target.value) })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
            />
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button 
            type="submit" 
            disabled={isCreating || !roomData.name.trim() || !hasCoords}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              <>
                {isEditMode ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isEditMode ? 'Salvar Alterações' : 'Criar Ponto'}
              </>
            )}
          </button>
          <button 
            type="button" 
            disabled={isCreating}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium text-sm" 
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
