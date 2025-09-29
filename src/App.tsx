import { AuthProvider } from './provider/AuthContext';
import { RoomProvider } from './provider/RoomContext';
import { ProjectProvider } from './provider/ProjectContext';
import AppRoutes from './router/appRoutes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <ProjectProvider>
          <AppRoutes />
        </ProjectProvider>
      </RoomProvider>
    </AuthProvider>
  );
}

export default App;
