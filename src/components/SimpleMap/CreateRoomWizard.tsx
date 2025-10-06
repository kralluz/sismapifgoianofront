import React, { useState } from 'react';
import { ChevronRight, Folder, Plus } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, title: 'Dados da Sala', description: 'Informações básicas do local' },
  { id: 2, title: 'Traçar Caminho', description: 'Defina a rota no mapa' },
  { id: 3, title: 'Adicionar Projetos', description: 'Projetos nesta sala' }
];

interface RoomFormData {
  name: string;
  description: string;
  type: 'classroom' | 'lab' | 'library' | 'auditorium' | 'restaurant' | 'office';
  capacity: number;
  floor: number;
  building: string;
}

interface CreateRoomWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  onStartTracing: () => void;
  onStopTracing: () => void;
  isTracingPath: boolean;
  tracedPath: Array<[number, number]>;
  roomPosition: { x: number; y: number } | null;
  onCreateRoom: (data: RoomFormData, path: Array<[number, number]>, position: { x: number; y: number }) => Promise<void>;
}

const CreateRoomWizard: React.FC<CreateRoomWizardProps> = ({ 
  onComplete, 
  onCancel,
  onStartTracing,
  onStopTracing,
  isTracingPath,
  tracedPath,
  roomPosition,
  onCreateRoom,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomData, setRoomData] = useState<RoomFormData>({
    name: '',
    description: '',
    type: 'classroom',
    capacity: 20,
    floor: 1,
    building: 'Campus Principal',
  });

  const goToNextStep = () => {
    if (currentStep < 3) {
      if (currentStep === 1) {
        // Ao ir para etapa 2, iniciar traçado
        onStartTracing();
      }
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      // Finalizar criação
      handleFinish();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      if (currentStep === 2) {
        // Ao voltar da etapa 2, parar traçado
        onStopTracing();
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!roomPosition || tracedPath.length < 2) {
      alert('É necessário traçar um caminho com pelo menos 2 pontos no mapa');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateRoom(roomData, tracedPath, roomPosition);
      onComplete();
    } catch (error) {
      console.error('Erro ao criar sala:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header com Steps */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Nova Sala</h2>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className={`w-4 h-4 mx-2 ${currentStep > step.id ? 'text-green-500' : 'text-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Dados da Sala */}
        {currentStep === 1 && (
          <div className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={roomData.description}
                onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrição do local..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={roomData.type}
                  onChange={(e) => setRoomData({ ...roomData, type: e.target.value as any })}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidade
                </label>
                <input
                  type="number"
                  min={1}
                  value={roomData.capacity}
                  onChange={(e) => setRoomData({ ...roomData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Andar
                </label>
                <input
                  type="number"
                  value={roomData.floor}
                  onChange={(e) => setRoomData({ ...roomData, floor: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prédio
                </label>
                <input
                  type="text"
                  value={roomData.building}
                  onChange={(e) => setRoomData({ ...roomData, building: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Traçar Caminho */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🗺️ Traçar Rota no Mapa</h3>
              <p className="text-sm text-blue-700 mb-4">
                Clique no mapa para adicionar pontos que formam o caminho até esta sala.
              </p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Clique para adicionar pontos sequenciais</li>
                <li>• O último ponto será a posição da sala</li>
                <li>• Mínimo 2 pontos para criar uma rota</li>
              </ul>
            </div>

            {/* Status do Traçado */}
            <div className={`p-4 rounded-lg border ${
              tracedPath.length >= 2 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium ${
                  tracedPath.length >= 2 ? 'text-green-900' : 'text-amber-900'
                }`}>
                  Status: {isTracingPath ? 'Traçando...' : 'Aguardando'}
                </h4>
                <span className={`text-sm font-semibold ${
                  tracedPath.length >= 2 ? 'text-green-700' : 'text-amber-700'
                }`}>
                  {tracedPath.length} pontos
                </span>
              </div>
              
              {tracedPath.length > 0 && (
                <div className="text-xs text-gray-600 mt-2">
                  Pontos: {tracedPath.map((p) => `(${p[0].toFixed(0)}, ${p[1].toFixed(0)})`).join(' → ')}
                </div>
              )}
              
              {roomPosition && (
                <div className="text-xs text-gray-600 mt-1">
                  Posição final: ({roomPosition.x.toFixed(1)}, {roomPosition.y.toFixed(1)})
                </div>
              )}
            </div>

            <div className={`p-4 rounded-lg border ${
              tracedPath.length >= 2 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <p className={`text-sm ${
                tracedPath.length >= 2 ? 'text-green-800' : 'text-amber-800'
              }`}>
                {tracedPath.length >= 2 
                  ? '✓ Rota válida! Clique em "Próximo" para continuar.'
                  : '⚠️ Clique no mapa para traçar o caminho (mínimo 2 pontos).'
                }
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Adicionar Projetos */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">✅ Sala Criada!</h3>
              <p className="text-sm text-green-700 mb-4">
                A sala foi criada com sucesso. Agora você pode adicionar projetos que acontecem nesta sala.
              </p>
            </div>

            <div className="text-center py-8">
              <Folder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Nenhum projeto adicionado ainda
              </p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Adicionar Projeto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
        <button
          onClick={currentStep === 1 ? onCancel : goToPreviousStep}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {currentStep === 1 ? 'Cancelar' : 'Voltar'}
        </button>

        <button
          onClick={currentStep === 3 ? goToNextStep : goToNextStep}
          disabled={(currentStep === 1 && !roomData.name.trim()) || (currentStep === 2 && tracedPath.length < 2) || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Criando...' : (currentStep === 3 ? 'Concluir' : 'Próximo')}
        </button>
      </div>
    </div>
  );
};

export default CreateRoomWizard;
