import { AuthProvider } from './provider/AuthContext';
import AppRoutes from './router/appRoutes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
