// Exemplo de uso dos Context APIs criados

import React, { useEffect } from 'react';
import { useRoom, useProject, useAuth } from '../provider';

const ExampleUsage: React.FC = () => {
  const { rooms, isLoading: roomsLoading, error: roomsError, fetchRooms, createRoom } = useRoom();
  const { projects, isLoading: projectsLoading, error: projectsError, fetchProjects, createProject } = useProject();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
      fetchProjects();
    }
  }, [isAuthenticated, fetchRooms, fetchProjects]);

  const handleCreateRoom = async () => {
    try {
      await createRoom({
        name: 'Sala de Reunião A101',
        x: 100,
        y: 200,
        description: 'Sala para reuniões pequenas',
        capacity: 10,
        type: 'classroom',
        floor: 1,
        building: 'Bloco A',
        amenities: ['Projetor', 'Quadro Branco']
      });
      console.log('Sala criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar sala:', error);
    }
  };

  const handleCreateProject = async () => {
    try {
      await createProject({
        title: 'Sistema de Gestão Acadêmica',
        type: 'Desenvolvimento de Software',
        startAt: '2025-01-15T09:00:00Z',
        endAt: '2025-03-15T18:00:00Z',
        roomId: 1
      });
      console.log('Projeto criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    }
  };

  if (!isAuthenticated) {
    return <div>Por favor, faça login para acessar os dados.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Exemplo de Uso dos Context APIs</h1>

      <section>
        <h2>Salas ({rooms.length})</h2>
        {roomsLoading && <p>Carregando salas...</p>}
        {roomsError && <p style={{ color: 'red' }}>Erro: {roomsError}</p>}
        <button onClick={handleCreateRoom} disabled={roomsLoading}>
          Criar Nova Sala
        </button>
        <ul>
          {rooms.map(room => (
            <li key={room.id}>
              {room.name} - {room.building} - Capacidade: {room.capacity}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Projetos ({projects.length})</h2>
        {projectsLoading && <p>Carregando projetos...</p>}
        {projectsError && <p style={{ color: 'red' }}>Erro: {projectsError}</p>}
        <button onClick={handleCreateProject} disabled={projectsLoading}>
          Criar Novo Projeto
        </button>
        <ul>
          {projects.map(project => (
            <li key={project.id}>
              {project.title} - {project.type}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ExampleUsage;