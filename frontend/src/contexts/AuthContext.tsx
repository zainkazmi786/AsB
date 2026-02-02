import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'accountant' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const response = await authApi.verify();
          if (response.success && response.data) {
            setUser({
              id: response.data.user.id,
              name: response.data.user.name,
              role: response.data.user.role,
            });
          } else {
            // Invalid token, remove it
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('auth_token');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(username, password);
      
      if (response.success && response.data) {
        // Store token
        localStorage.setItem('auth_token', response.data.token);
        
        // Set user
        setUser({
          id: response.data.user.id,
          name: response.data.user.name,
          role: response.data.user.role,
        });
        
        return true;
      } else {
        // Throw error with message for Login component to catch
        throw new Error(response.message || 'صارف نام یا پاس ورڈ غلط ہے');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw to let Login component handle the error message
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
