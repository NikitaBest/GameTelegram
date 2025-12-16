import { useState, useEffect, useCallback } from 'react';
import { login, AuthResponse, AuthError } from '../api/services/authService';
import { saveToken, saveUser, getToken, getUser, clearAuth, StoredUser } from '../utils/storage';

interface UseAuthReturn {
  user: StoredUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

/**
 * Хук для управления авторизацией
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<StoredUser | null>(getUser());
  const [token, setToken] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(token && user);

  /**
   * Выполнение авторизации
   */
  const performLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await login();
      
      // Сохраняем токен
      saveToken(response.token);
      setToken(response.token);

      // Сохраняем данные пользователя
      const userData: StoredUser = {
        id: response.user.id,
        telegramId: response.user.telegramId,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        userName: response.user.userName,
        isPremium: response.user.isPremium,
        starsAmount: response.user.starsAmount,
        subscribedToChannel: response.user.subscribedToChannel,
      };
      
      saveUser(userData);
      setUser(userData);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'Ошибка при авторизации');
      console.error('Ошибка авторизации:', authError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Выход из системы
   */
  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  /**
   * Обновление авторизации
   */
  const refreshAuth = useCallback(async () => {
    await performLogin();
  }, [performLogin]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    error,
    login: performLogin,
    logout,
    refreshAuth,
  };
}

