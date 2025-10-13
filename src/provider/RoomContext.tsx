import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Room, RoomContextType, CreateRoomRequest, UpdateRoomRequest } from '../types';
import { api } from '../services/api';

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom deve ser usado dentro de um RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getRooms();
      setRooms(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar salas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoom = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getRoom(id.toString());
      setCurrentRoom(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar sala';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (roomData: CreateRoomRequest): Promise<Room> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate room data before sending
      if (!roomData.name || roomData.name.trim().length < 2) {
        throw new Error('Nome da sala deve ter pelo menos 2 caracteres');
      }
      
      if (roomData.x < 0 || roomData.y < 0) {
        throw new Error('Coordenadas devem ser positivas');
      }
      
      const newRoom = await api.createRoom(roomData);
      
      setRooms(prev => [...prev, newRoom]);
      return newRoom;
    } catch (err) {
      let errorMessage = 'Erro ao criar sala';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRoom = async (id: number, roomData: UpdateRoomRequest): Promise<Room> => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedRoom = await api.updateRoom(id.toString(), roomData);
      setRooms(prev => prev.map(room =>
        room.id === id ? updatedRoom : room
      ));
      if (currentRoom?.id === id) {
        setCurrentRoom(updatedRoom);
      }
      return updatedRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar sala';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRoom = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.deleteRoom(id.toString());
      setRooms(prev => prev.filter(room => room.id !== id));
      if (currentRoom?.id === id) {
        setCurrentRoom(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar sala';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value: RoomContextType = {
    rooms,
    currentRoom,
    isLoading,
    error,
    fetchRooms,
    fetchRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    clearError,
    setCurrentRoom,
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;