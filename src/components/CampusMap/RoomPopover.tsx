import React from 'react';
import type { Room, Event } from '../../types';
import {
  X,
  Book,
  FlaskConical,
  Volume2,
  Utensils,
  Users,
  MapPin,
} from 'lucide-react';

interface RoomPopoverProps {
  room: Room;
  event?: Event | null;
  position: { left: string; top: string };
  onClose: () => void;
}

const RoomPopover: React.FC<RoomPopoverProps> = ({
  room,
  event,
  position,
  onClose,
}) => {
  const getRoomIcon = (type: string) => {
    const icons: Record<string, any> = {
      classroom: Book,
      lab: FlaskConical,
      library: Book,
      auditorium: Volume2,
      restaurant: Utensils,
      office: Users,
    };
    return icons[type] || MapPin;
  };

  return (
    <div
      className="absolute bg-white rounded-xl shadow-2xl p-5 max-w-sm border border-gray-100 backdrop-blur-sm bg-white/95 z-50 transition-all duration-200"
      style={position}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {React.createElement(getRoomIcon(room.type), {
            className: 'w-5 h-5 text-blue-600',
          })}
          <h3 className="font-bold text-gray-900">{room.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <p className="text-gray-600 text-sm">{room.description}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            🏢 Prédio {room.building}
          </span>
          <span className="flex items-center gap-1">
            🏢 {room.floor}º Andar
          </span>
          <span className="flex items-center gap-1">
            👥 {room.capacity} pessoas
          </span>
        </div>
      </div>

      {room.amenities && room.amenities.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            ⚡ Recursos Disponíveis:
          </h4>
          <div className="flex flex-wrap gap-1">
            {room.amenities.map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {event && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600">📅</span>
            <span className="font-semibold text-sm text-gray-900">
              Evento Atual:
            </span>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg">
            <p className="font-semibold text-sm text-gray-900 mb-1">
              {event.title}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              📅 {event.time} - {event.date}
            </p>
            <p className="text-xs text-gray-600 mb-2">
              👨‍🏫 {event.speaker}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Status: {event?.status || 'N/A'}
              </span>
              <span className="text-xs text-gray-500">
                👥 {event?.attendees || 0} participantes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de direção da seta */}
      <div
        className="absolute w-3 h-3 bg-white border border-gray-100 transform rotate-45"
        style={{
          left: room.x < 50 ? '-6px' : 'auto',
          right: room.x >= 50 ? '-6px' : 'auto',
          top: '50%',
          marginTop: '-6px',
          zIndex: -1,
        }}
      />
    </div>
  );
};

export default RoomPopover;