import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "../provider/AuthContext";
/// import Login from "../components/Login";
import CampusMapMVP from "../CampusMap";
import UserList from "../components/UserList";
import Layout from "../components/Layout";

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Rota de Login - Pública */}
        <Route
          path="/login"
          // element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          element={<Navigate to="/" />}
        />

        {/* Rotas Protegidas com Layout */}
        <Route
          path="/"
          element={
            // isAuthenticated ? (
            <Layout />
            /* ) : (
              <Navigate to="/login" replace />
            ) */
          }
        >
          {/* Rotas filhas que serão renderizadas dentro do Layout */}
          <Route index element={<CampusMapMVP />} />
          <Route path="mapa" element={<CampusMapMVP />} />

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
