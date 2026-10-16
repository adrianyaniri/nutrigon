import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Role } from "../types";

export function AdminIndexRedirect() {
  const { user } = useAuth();
  if (user?.role === Role.ADMIN_GENERAL) {
    return <Navigate to="/admin/catalogo-maestro" replace />;
  }
  return <Navigate to="/admin/productos" replace />;
}
