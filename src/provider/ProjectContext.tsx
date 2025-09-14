import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Project, ProjectContextType, CreateProjectRequest, UpdateProjectRequest } from '../types';
import { api } from '../services/api';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject deve ser usado dentro de um ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar projetos';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProject = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getProject(id.toString());
      setCurrentProject(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar projeto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (projectData: CreateProjectRequest): Promise<Project> => {
    try {
      setIsLoading(true);
      setError(null);
      const newProject = await api.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar projeto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (id: number, projectData: UpdateProjectRequest): Promise<Project> => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedProject = await api.updateProject(id.toString(), projectData);
      setProjects(prev => prev.map(project =>
        project.id === id ? updatedProject : project
      ));
      if (currentProject?.id === id) {
        setCurrentProject(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar projeto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.deleteProject(id.toString());
      setProjects(prev => prev.filter(project => project.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar projeto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value: ProjectContextType = {
    projects,
    currentProject,
    isLoading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    clearError,
    setCurrentProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectProvider;