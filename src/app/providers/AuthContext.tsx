import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../../shared/types';
import { authUtils } from '../../shared/utils/authUtils';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Initialize auth state from localStorage
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      // Check if token is expired
      if (authUtils.isTokenExpired()) {
        authUtils.clearAuthData();
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Check if user is authenticated
      if (authUtils.isAuthenticated()) {
        const storedUser = authUtils.getUserData();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear corrupted data
      authUtils.clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simple authentication logic - in production, this would call an API
      if (username && password) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, accept any non-empty username/password
        // In production, validate against backend
        const user: User = {
          username,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };
        
        // Generate a simple token (in production, this would come from the server)
        const token = btoa(`${username}:${Date.now()}`);
        
        // Store in localStorage using utility functions
        authUtils.storeAuthData(token, user);
        
        // Update state
        setUser(user);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Clear localStorage using utility functions
      authUtils.clearAuthData();
      
      // Update state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
