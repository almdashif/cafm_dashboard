// Authentication utility functions for localStorage operations

const AUTH_TOKEN_KEY = 'cafm_auth_token';
const USER_DATA_KEY = 'cafm_user_data';

export interface StoredUser {
  username: string;
  isAuthenticated: boolean;
  loginTime?: string;
  lastActive?: string;
}

export const authUtils = {
  // Store authentication data
  storeAuthData: (token: string, user: StoredUser): void => {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  },

  // Get stored authentication token
  getAuthToken: (): string | null => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  // Get stored user data
  getUserData: (): StoredUser | null => {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = authUtils.getAuthToken();
    const userData = authUtils.getUserData();
    return !!(token && userData);
  },

  // Clear all authentication data
  clearAuthData: (): void => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Update user's last active time
  updateLastActive: (): void => {
    try {
      const userData = authUtils.getUserData();
      if (userData) {
        userData.lastActive = new Date().toISOString();
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  },

  // Check if token is expired (simple implementation)
  isTokenExpired: (): boolean => {
    // In a real application, you would check the JWT token expiration
    // For now, we'll use a simple approach based on login time
    try {
      const userData = authUtils.getUserData();
      if (userData?.loginTime) {
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        // Token expires after 24 hours (configurable)
        return hoursSinceLogin > 24;
      }
      return true;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
};
