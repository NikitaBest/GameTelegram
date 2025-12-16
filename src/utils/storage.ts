// Утилиты для работы с localStorage

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface StoredUser {
  id: number;
  telegramId: number;
  firstName: string;
  lastName: string | null;
  userName: string | null;
  isPremium: boolean;
  starsAmount: number;
  subscribedToChannel: boolean;
}

/**
 * Сохранение токена авторизации
 */
export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Ошибка при сохранении токена:', error);
  }
}

/**
 * Получение токена авторизации
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Ошибка при получении токена:', error);
    return null;
  }
}

/**
 * Удаление токена авторизации
 */
export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Ошибка при удалении токена:', error);
  }
}

/**
 * Сохранение данных пользователя
 */
export function saveUser(user: StoredUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Ошибка при сохранении данных пользователя:', error);
  }
}

/**
 * Получение данных пользователя
 */
export function getUser(): StoredUser | null {
  try {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    return JSON.parse(userData) as StoredUser;
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return null;
  }
}

/**
 * Удаление данных пользователя
 */
export function removeUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Ошибка при удалении данных пользователя:', error);
  }
}

/**
 * Очистка всех данных авторизации
 */
export function clearAuth(): void {
  removeToken();
  removeUser();
}

