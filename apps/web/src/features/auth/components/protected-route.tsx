import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import type { Role } from "../types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  unauthorizedRedirectTo?: string;
  children?: ReactNode;
}

export function ProtectedRoute({
  allowedRoles,
  unauthorizedRedirectTo = "/catalogo",
  children,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-foreground">
        <div
          role="status"
          aria-label="Cargando sesión..."
          className="size-8 animate-spin rounded-full border-2 border-brand-gold border-t-transparent"
        />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={unauthorizedRedirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
