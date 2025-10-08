import type { Room } from "../types";

// Mock data for fallback
const campusData: any[] = [];

// Convert local data to match Room interface
const convertLocalDataToRoom = (localRoom: any): Room => ({
  id: parseInt(localRoom.id.replace(/\D/g, '')) || Math.random() * 1000,
  name: localRoom.name,
  description: localRoom.description,
  capacity: localRoom.capacity,
  type: localRoom.type,
  floor: localRoom.floor,
  building: localRoom.building,
  amenities: localRoom.amenities,
  x: localRoom.x,
  y: localRoom.y,
  path: localRoom.path
});

export const fallbackApi = {
  getRooms: async (): Promise<Room[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return campusData.map(convertLocalDataToRoom);
  },

  getRoom: async (id: string): Promise<Room> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const room = campusData.find((r: any) => r.id === id);
    if (!room) throw new Error("Sala não encontrada");
    return convertLocalDataToRoom(room);
  },

  createRoom: async (roomData: any): Promise<Room> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newRoom: Room = {
      id: Math.floor(Math.random() * 10000),
      ...roomData,
    };
    return newRoom;
  },

  updateRoom: async (id: string, roomData: any): Promise<Room> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: parseInt(id), ...roomData };
  },

  deleteRoom: async (_id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Simulate successful deletion
  }
};