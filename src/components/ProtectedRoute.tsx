import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

const roleBasePath: Record<UserRole, string> = {
  powerhouse: "/powerhouse",
  super: "/super",
  master: "/master",
  player: "/player",
};

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== allowedRole) {
    const redirectTo = roleBasePath[user.role] || "/";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
