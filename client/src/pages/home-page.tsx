import { useEffect } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    document.title = "ShopLocal - Home";
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Redirect based on user role
  if (user.role === UserRole.CUSTOMER) {
    return <Redirect to="/customer" />;
  } else if (user.role === UserRole.VENDOR) {
    return <Redirect to="/vendor" />;
  } else if (user.role === UserRole.ADMIN) {
    return <Redirect to="/admin" />;
  }

  return <Redirect to="/auth" />;
}
