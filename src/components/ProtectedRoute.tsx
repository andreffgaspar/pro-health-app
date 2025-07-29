import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'athlete' | 'professional';
}

export const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      if (requiredUserType && profile?.user_type !== requiredUserType) {
        // Redirect to appropriate dashboard based on user type
        if (profile?.user_type === 'athlete') {
          navigate('/athlete-dashboard', { replace: true });
        } else if (profile?.user_type === 'professional') {
          navigate('/professional-dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }
    }
  }, [user, profile, loading, navigate, requiredUserType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredUserType && profile?.user_type !== requiredUserType) {
    return null;
  }

  return <>{children}</>;
};