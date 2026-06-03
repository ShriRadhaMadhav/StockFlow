import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background-secondary/50">
    <div className="h-10 w-10 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
  </div>
);

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { token, user, isLoading, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      void fetchMe();
    }
  }, [fetchMe, token, user]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading && !user) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { token, user, activeStore } = useAuthStore();

  if (token && user) {
    return <Navigate to={activeStore ? '/dashboard' : '/store-setup'} replace />;
  }

  return <>{children}</>;
};

export const StoreRequiredRoute = ({ children }: { children: ReactNode }) => {
  const { activeStore } = useAuthStore();

  if (!activeStore) {
    return <Navigate to="/store-setup" replace />;
  }

  return <>{children}</>;
};
