import { apiClient } from '../apiClient';

export interface LeaderboardUser {
  userId: number;
  userTelegramId: number;
  participatingId: number;
  firstName: string;
  lastName: string;
  userName: string;
  photoUrl: string;
  photoData: string;
  maxPoints: number;
  maxPointsAlias: string;
  topNumber: number;
}

export interface LeaderboardValue {
  totalCount: number;
  items: LeaderboardUser[];
}

export interface LeaderboardResponse {
  value: LeaderboardValue;
  isSuccess: boolean;
  error: string;
}

export interface LeaderboardRequest {
  drawId: number;
  fromNumber: number;
  toNumber: number;
}

/**
 * Получение списка лидеров по диапазону позиций
 * 
 * @param drawId - ID розыгрыша
 * @param fromNumber - Начальный номер позиции (начинается с 1)
 * @param toNumber - Конечный номер позиции (включительно)
 * @returns Список лидеров
 */
export async function getLeaderboard(
  drawId: number | string,
  fromNumber: number = 1,
  toNumber: number = 100
): Promise<LeaderboardResponse> {
  if (!drawId) {
    throw new Error('drawId обязателен для получения списка лидеров');
  }

  try {
    const response = await apiClient.post<LeaderboardResponse>(
      '/participating/top-list',
      {
        drawId: Number(drawId),
        fromNumber: fromNumber,
        toNumber: toNumber,
      }
    );
    
    return response;
  } catch (error) {
    console.error('Ошибка при получении списка лидеров:', error);
    throw error;
  }
}

/**
 * Получение места текущего пользователя
 * 
 * @param drawId - ID розыгрыша
 * @returns Данные пользователя с его местом в рейтинге
 */
export async function getUserRank(
  drawId: number | string
): Promise<LeaderboardResponse> {
  if (!drawId) {
    throw new Error('drawId обязателен для получения места пользователя');
  }

  try {
    const response = await apiClient.post<LeaderboardResponse>(
      '/participating/top-list/with-user',
      {
        drawId: Number(drawId),
      }
    );
    
    return response;
  } catch (error) {
    console.error('Ошибка при получении места пользователя:', error);
    throw error;
  }
}

/**
 * Получение следующей порции лидеров (для ленивой загрузки)
 * 
 * @param drawId - ID розыгрыша
 * @param fromNumber - Начальный номер позиции
 * @param toNumber - Конечный номер позиции
 * @returns Список лидеров
 */
export async function getLeaderboardPage(
  drawId: number | string,
  fromNumber: number,
  toNumber: number
): Promise<LeaderboardResponse> {
  return getLeaderboard(drawId, fromNumber, toNumber);
}

