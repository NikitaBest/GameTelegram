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
  CountAfter: number;
  CountBefore: number;
  DrawId: string | number;
}

/**
 * Получение списка лидеров с пользователем в центре
 * 
 * @param drawId - ID розыгрыша
 * @param countBefore - Количество лидеров до пользователя
 * @param countAfter - Количество лидеров после пользователя
 * @returns Список лидеров
 */
export async function getLeaderboard(
  drawId: number | string,
  countBefore: number = 10,
  countAfter: number = 10
): Promise<LeaderboardResponse> {
  if (!drawId) {
    throw new Error('drawId обязателен для получения списка лидеров');
  }

  try {
    const response = await apiClient.post<LeaderboardResponse>(
      '/participating/top-list/with-user',
      {
        CountAfter: countAfter,
        CountBefore: countBefore,
        DrawId: String(drawId),
      }
    );
    
    return response;
  } catch (error) {
    console.error('Ошибка при получении списка лидеров:', error);
    throw error;
  }
}

/**
 * Получение следующей порции лидеров (для ленивой загрузки)
 * 
 * @param drawId - ID розыгрыша
 * @param offset - Смещение от начала списка
 * @param limit - Количество записей для загрузки
 * @returns Список лидеров
 */
export async function getLeaderboardPage(
  drawId: number | string,
  offset: number,
  limit: number = 20
): Promise<LeaderboardResponse> {
  if (!drawId) {
    throw new Error('drawId обязателен для получения списка лидеров');
  }

  try {
    // Используем тот же эндпоинт, но с другими параметрами
    // Если бекенд поддерживает пагинацию, нужно будет уточнить параметры
    const response = await apiClient.post<LeaderboardResponse>(
      '/participating/top-list/with-user',
      {
        CountAfter: limit,
        CountBefore: 0,
        DrawId: String(drawId),
      }
    );
    
    return response;
  } catch (error) {
    console.error('Ошибка при получении списка лидеров:', error);
    throw error;
  }
}

