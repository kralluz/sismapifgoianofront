import React from 'react';

const SimpleMapa: React.FC = () => {
  return (
    <div className="h-screen w-full bg-gray-100 flex items-center justify-center">
      <div className="w-full h-full relative overflow-hidden">
        {/* Apenas a imagem do mapa */}
        <img
          src="/mapa/mapa.png"
          alt="Mapa do Campus IF Goiano"
          className="w-full h-full object-contain"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
        
        {/* Título simples sobreposto */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
          <h1 className="text-lg font-bold text-gray-800">
            Mapa do Campus - Versão Simples
          </h1>
          <p className="text-sm text-gray-600">
            Visualização básica do mapa
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapa;