import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole } from "@shared/schema";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  roles?: string[];
}

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
console.log("User after registration:", user);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If roles are specified, check if user has required role
  if (roles && roles.length > 0) {
    const hasRole = roles.includes(user.role) || user.role === UserRole.ADMIN;
    
    if (!hasRole) {
      // Redirect based on user role
      let redirectPath = "/";
      if (user.role === UserRole.CUSTOMER) {
        redirectPath = "/customer";
      } else if (user.role === UserRole.VENDOR) {
        redirectPath = "/vendor";
      } else if (user.role === UserRole.ADMIN) {
        redirectPath = "/admin";
      }
      
      return (
        <Route path={path}>
          <Redirect to={redirectPath} />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
