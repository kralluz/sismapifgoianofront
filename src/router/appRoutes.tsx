import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "../provider/AuthContext";
import Login from "../components/Login";
import UserList from "../components/UserList";
import Layout from "../components/Layout";
import NewMap from "../components/NewMap";

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Rota principal - Mapa Interativo (pública - todos podem visualizar) */}
        <Route path="/" element={<NewMap />} />

        {/* Rota de Login - Pública */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Rotas Protegidas com Layout */}
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              <Layout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Administração - Apenas ADMs */}
          <Route
            path="usuarios"
            element={
              user?.role === "admin" ? (
                <UserList />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Route>

        {/* Rota padrão para URLs não encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
