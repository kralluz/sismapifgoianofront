// Exemplo de uso dos Context APIs criados

import React, { useEffect } from "react";
import { useRoom, useProject, useAuth } from "../provider";

const ExampleUsage: React.FC = () => {
  const {
    rooms,
    isLoading: roomsLoading,
    error: roomsError,
    fetchRooms,
    createRoom,
  } = useRoom();
  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
    fetchProjects,
    createProject,
  } = useProject();
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
        name: "Sala de Reunião A101",
        x: 100,
        y: 200,
        description: "Sala para reuniões pequenas",
      });
    } catch (error) {}
  };

  const handleCreateProject = async () => {
    try {
      await createProject({
        number: new Date().getFullYear(),
        title: "Sistema de Gestão Acadêmica",
        roomId: 1,
      });
    } catch (error) {}
  };

  if (!isAuthenticated) {
    return <div>Por favor, faça login para acessar os dados.</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Exemplo de Uso dos Context APIs</h1>

      <section>
        <h2>Salas ({rooms.length})</h2>
        {roomsLoading && <p>Carregando salas...</p>}
        {roomsError && <p style={{ color: "red" }}>Erro: {roomsError}</p>}
        <button onClick={handleCreateRoom} disabled={roomsLoading}>
          Criar Nova Sala
        </button>
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>
              {room.name} - {room.building} - Capacidade: {room.capacity}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Projetos ({projects.length})</h2>
        {projectsLoading && <p>Carregando projetos...</p>}
        {projectsError && <p style={{ color: "red" }}>Erro: {projectsError}</p>}
        <button onClick={handleCreateProject} disabled={projectsLoading}>
          Criar Novo Projeto
        </button>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              #{project.number} - {project.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ExampleUsage;
