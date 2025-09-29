import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Room, CreateRoomRequest } from '../types';
import { Plus, X, Loader2, MapPin } from 'lucide-react';

const SimpleMap: React.FC = () => {
  // Estados
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newRoomCoords, setNewRoomCoords] = useState<{ x: number; y: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dados do novo ponto/sala
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    type: 'classroom' as const,
    capacity: 20,
    floor: 1,
    building: 'Campus Principal',
  });

  // Garantir que temos um token para desenvolvimento
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

  // Carregar salas existentes
  useEffect(() => {
    loadRooms();
  }, []);

  // Limpar mensagem de sucesso
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const roomsData = await api.getRooms();
      setRooms(roomsData);
    } catch (err) {
      console.error('Erro ao carregar salas:', err);
      setError('Erro ao carregar pontos do mapa');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Calcular coordenadas do clique
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    console.log('Clique no mapa:', { x, y });
    
    // Abrir modal para criar novo ponto
    setNewRoomCoords({ x, y });
    setShowModal(true);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomCoords || !newRoomData.name.trim()) return;

    setIsCreating(true);

    const roomData: CreateRoomRequest = {
      name: newRoomData.name.trim(),
      x: newRoomCoords.x,
      y: newRoomCoords.y,
      description: newRoomData.description.trim() || `Ponto ${newRoomData.name.trim()}`,
      capacity: newRoomData.capacity,
      type: newRoomData.type,
      floor: newRoomData.floor,
      building: newRoomData.building.trim(),
      amenities: [],
      path: []
    };

    try {
      await api.createRoom(roomData);
      setSuccessMessage(`Ponto "${roomData.name}" criado com sucesso!`);
      
      // Fechar modal e resetar dados
      setShowModal(false);
      setNewRoomCoords(null);
      setNewRoomData({
        name: '',
        description: '',
        type: 'classroom',
        capacity: 20,
        floor: 1,
        building: 'Campus Principal',
      });

      // Recarregar salas
      await loadRooms();
    } catch (err) {
      console.error('Erro ao criar sala:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar ponto';
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setNewRoomCoords(null);
    setNewRoomData({
      name: '',
      description: '',
      type: 'classroom',
      capacity: 20,
      floor: 1,
      building: 'Campus Principal',
    });
  };

  return (
    <div className="h-screen w-full bg-gray-100 flex flex-col">
      {/* Header com instruções */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Mapa Interativo Simples
              </h1>
              <p className="text-sm text-gray-600">
                Clique em qualquer lugar do mapa para criar um novo ponto/sala
              </p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>Total de pontos: {rooms.length}</span>
                {loading && <span className="text-blue-600">Carregando...</span>}
              </div>
            </div>
            
            {/* Botão de teste - clique rápido */}
            <button
              onClick={() => {
                setNewRoomCoords({ x: 50, y: 50 });
                setNewRoomData(prev => ({ ...prev, name: `Ponto ${rooms.length + 1}` }));
                setShowModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Teste Rápido
            </button>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {successMessage && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Container do Mapa */}
      <div className="flex-1 p-4">
        <div className="w-full h-full max-w-6xl max-h-4xl mx-auto">
          <svg
            className="w-full h-full border border-gray-300 rounded-lg shadow-lg bg-white cursor-crosshair"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            onClick={handleMapClick}
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

            {/* Renderizar pontos existentes */}
            {rooms.map((room) => (
              <g key={room.id}>
                {/* Círculo do ponto */}
                <circle
                  cx={room.x}
                  cy={room.y}
                  r="1.5"
                  fill="#3B82F6"
                  stroke="#1E40AF"
                  strokeWidth="0.2"
                  className="hover:fill-blue-700 transition-colors cursor-pointer"
                />
                
                {/* Label do ponto */}
                <text
                  x={room.x}
                  y={room.y - 2}
                  textAnchor="middle"
                  className="fill-gray-700 text-xs font-medium pointer-events-none"
                  fontSize="2"
                >
                  {room.name}
                </text>
              </g>
            ))}

            {/* Loading overlay */}
            {loading && (
              <g>
                <rect x="0" y="0" width="100" height="100" fill="rgba(255,255,255,0.7)" />
                <text x="50" y="50" textAnchor="middle" className="fill-gray-600" fontSize="3">
                  Carregando pontos...
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Modal de criação de ponto */}
      {showModal && newRoomCoords && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateRoom} className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Criar Novo Ponto
              </h2>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  📍 Posição: ({newRoomCoords.x.toFixed(1)}, {newRoomCoords.y.toFixed(1)})
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Ponto *</label>
                  <input 
                    type="text" 
                    required 
                    value={newRoomData.name} 
                    onChange={e => setNewRoomData(d => ({ ...d, name: e.target.value }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Entrada Principal, Sala 101"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <input 
                    type="text" 
                    value={newRoomData.description} 
                    onChange={e => setNewRoomData(d => ({ ...d, description: e.target.value }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrição opcional"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo</label>
                    <select 
                      value={newRoomData.type} 
                      onChange={e => setNewRoomData(d => ({ ...d, type: e.target.value as any }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={newRoomData.capacity} 
                      onChange={e => setNewRoomData(d => ({ ...d, capacity: Number(e.target.value) }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Botões - Com espaçamento e estilo melhorados */}
              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-200">
                <button 
                  type="submit" 
                  disabled={isCreating || !newRoomData.name.trim()}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Criar Ponto
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  disabled={isCreating}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium text-sm" 
                  onClick={closeModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMap;