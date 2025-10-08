import React from 'react';
import type { Room } from '../../types';
import { Plus, X, Loader2 } from 'lucide-react';

interface RoomFormData {
  name: string;
  description: string;
  type: 'classroom' | 'lab' | 'library' | 'auditorium' | 'restaurant' | 'office';
  capacity: number;
  floor: number;
  building: string;
}

interface RoomEditorProps {
  mode: 'create' | 'edit';
  roomData: RoomFormData;
  onRoomDataChange: (data: RoomFormData) => void;
  isTracingPath: boolean;
  tracedPath: Array<[number, number]>;
  newRoomCoords: { x: number; y: number } | null;
  isCreating: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onStartTracing: () => void;
  onStopTracing: () => void;
  onRemoveLastPoint: () => void;
  onCancelTracing: () => void;
  onEditPath?: () => void;
  onRemovePath?: () => void;
  onCancelEdit?: () => void;
  roomToEdit?: Room | null;
}

const RoomEditor: React.FC<RoomEditorProps> = ({
  mode,
  roomData,
  onRoomDataChange,
  isTracingPath,
  tracedPath,
  newRoomCoords,
  isCreating,
  onSubmit,
  onCancel,
  onStartTracing,
  onStopTracing,
  onRemoveLastPoint,
  onCancelTracing,
  onEditPath,
  onRemovePath,
  onCancelEdit,
}) => {
  const isCreate = mode === 'create';

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-start gap-6">
          {/* Formulário de dados da sala */}
          <div className="w-80 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {isCreate ? (
                <>
                  <Plus className="w-5 h-5 text-blue-600" />
                  Nova Sala/Ponto
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Sala/Ponto
                </>
              )}
            </h3>
            
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Ponto *</label>
                <input 
                  type="text" 
                  required 
                  value={roomData.name} 
                  onChange={e => onRoomDataChange({ ...roomData, name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Ex: Entrada Principal, Sala 101"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <input 
                  type="text" 
                  value={roomData.description} 
                  onChange={e => onRoomDataChange({ ...roomData, description: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Descrição opcional"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select 
                    value={roomData.type} 
                    onChange={e => onRoomDataChange({ ...roomData, type: e.target.value as any })} 
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
                    onChange={e => onRoomDataChange({ ...roomData, capacity: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                  />
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button 
                  type="submit" 
                  disabled={isCreating || !roomData.name.trim() || (!newRoomCoords && tracedPath.length === 0)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isCreate ? 'Criando...' : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      {isCreate ? (
                        <>
                          <Plus className="w-4 h-4" />
                          Criar Ponto
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Salvar Alterações
                        </>
                      )}
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
          
          {/* Controles de traçado de caminho */}
          <div className="flex-1">
            <div className={`${isCreate ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
              <h4 className={`text-lg font-semibold ${isCreate ? 'text-orange-800' : 'text-blue-800'} mb-3 flex items-center gap-2`}>
                🛤️ {isCreate ? 'Traçar Caminho' : 'Editar Caminho'}
              </h4>
              
              {/* Status do traçado */}
              <div className={`mb-4 p-3 bg-white rounded-lg ${isCreate ? 'border-orange-200' : 'border-blue-200'} border`}>
                <p className={`text-sm ${isCreate ? 'text-orange-700' : 'text-blue-700'}`}>
                  {isCreate ? (
                    tracedPath.length === 0 
                      ? "Clique no mapa para iniciar o traçado do caminho."
                      : newRoomCoords
                        ? `Caminho finalizado com ${tracedPath.length} pontos. Posição final: (${newRoomCoords.x.toFixed(1)}, ${newRoomCoords.y.toFixed(1)})`
                        : `Traçando caminho... ${tracedPath.length} pontos adicionados.`
                  ) : (
                    isTracingPath
                      ? tracedPath.length === 0 
                        ? "Clique no mapa para iniciar um novo caminho."
                        : `Editando caminho... ${tracedPath.length} pontos adicionados.`
                      : tracedPath.length > 1
                        ? `Caminho atual com ${tracedPath.length} pontos. Posição: (${newRoomCoords?.x.toFixed(1)}, ${newRoomCoords?.y.toFixed(1)})`
                        : `Sem caminho definido. Posição: (${newRoomCoords?.x.toFixed(1)}, ${newRoomCoords?.y.toFixed(1)})`
                  )}
                </p>
                {tracedPath.length > 0 && (
                  <div className={`mt-2 text-xs ${isCreate ? 'text-orange-600' : 'text-blue-600'}`}>
                    Pontos: {tracedPath.map((p) => `(${p[0].toFixed(0)},${p[1].toFixed(0)})`).join(' → ')}
                  </div>
                )}
              </div>
              
              {/* Botões de controle */}
              <div className="flex gap-2">
                {isCreate ? (
                  // Botões para modo de criação
                  !isTracingPath ? (
                    <button
                      type="button"
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center gap-2"
                      onClick={onStartTracing}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      Iniciar Traçado
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
                        disabled={tracedPath.length === 0}
                        onClick={onRemoveLastPoint}
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
                        onClick={onStopTracing}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Finalizar Traçado
                      </button>
                      
                      <button
                        type="button"
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2"
                        onClick={onCancelTracing}
                      >
                        <X className="w-4 h-4" />
                        Cancelar Traçado
                      </button>
                    </>
                  )
                ) : (
                  // Botões para modo de edição
                  !isTracingPath ? (
                    <>
                      <button
                        type="button"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center gap-2"
                        onClick={onEditPath}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        Editar Caminho
                      </button>
                      <button
                        type="button"
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
                        onClick={onRemovePath}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remover Caminho
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
                        disabled={tracedPath.length === 0}
                        onClick={onRemoveLastPoint}
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
                        onClick={onStopTracing}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Finalizar Edição
                      </button>
                      
                      <button
                        type="button"
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2"
                        onClick={onCancelEdit}
                      >
                        <X className="w-4 h-4" />
                        Cancelar Edição
                      </button>
                    </>
                  )
                )}
              </div>
              
              {/* Dicas de uso */}
              <div className={`mt-4 p-3 bg-white rounded-lg ${isCreate ? 'border-orange-200' : 'border-blue-200'} border`}>
                <h5 className={`text-sm font-medium ${isCreate ? 'text-orange-800' : 'text-blue-800'} mb-2`}>
                  💡 {isCreate ? 'Dicas de Uso:' : 'Dicas de Edição:'}
                </h5>
                <ul className={`text-xs ${isCreate ? 'text-orange-700' : 'text-blue-700'} space-y-1`}>
                  {isCreate ? (
                    <>
                      <li>• Clique no mapa para adicionar pontos sequenciais ao caminho</li>
                      <li>• O último ponto será a posição final da sala</li>
                      <li>• Use "Remover Último" para corrigir pontos errados</li>
                      <li>• Mínimo de 2 pontos para criar um caminho válido</li>
                    </>
                  ) : (
                    <>
                      <li>• Clique em "Editar Caminho" para modificar a rota existente</li>
                      <li>• Clique no mapa para adicionar novos pontos sequenciais</li>
                      <li>• Use "Remover Último" para corrigir pontos errados</li>
                      <li>• "Remover Caminho" apaga toda a rota existente</li>
                      <li>• "Cancelar Edição" restaura o caminho original</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomEditor;
