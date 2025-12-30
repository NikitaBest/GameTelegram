import { apiClient } from '../apiClient';
import { md5 } from 'js-md5';

const HASH_SALT = '(02_hKY8123!';

export interface SaveAttemptRequest {
  hash: string;
  participatingId: string;
  points: number;
  pointsAlias: string;
}

export interface SaveAttemptResponse {
  value: any;
  isSuccess: boolean;
  error: string | null;
}

export interface CheckChannelSubscriptionBoostResponse {
  value: {
    subscribed: boolean;
  } | null;
  isSuccess: boolean;
  error: string | null;
}

/**
 * Генерация хеша для защиты от подделки запроса
 */
function generateHash(participatingId: number, points: number, pointsAlias: string): string {
  const hashSeed = 
    String(participatingId) + 
    String(points) + 
    (pointsAlias ?? '') + 
    HASH_SALT;
  
  return md5(hashSeed); // возвращает hex-строку в нижнем регистре
}

/**
 * Сохранение результата попытки игры
 */
export async function saveAttempt(
  participatingId: number,
  points: number
): Promise<SaveAttemptResponse> {
  if (!participatingId) {
    throw new Error('participatingId обязателен');
  }

  const pointsAlias = `${points} ${getPointsWord(points)}`;
  const hash = generateHash(participatingId, points, pointsAlias);

  const requestData: SaveAttemptRequest = {
    hash,
    participatingId: String(participatingId),
    points,
    pointsAlias,
  };

  // @ts-expect-error - Vite добавляет env в import.meta
  if (import.meta.env.DEV) {
    console.log('Сохранение результата игры:', requestData);
  }

  try {
    const response = await apiClient.post<SaveAttemptResponse>(
      '/attempt/save',
      requestData
    );
    
    // @ts-expect-error - Vite добавляет env в import.meta
    if (import.meta.env.DEV) {
      console.log('Результат сохранен:', response);
    }
    
    return response;
  } catch (error) {
    console.error('Ошибка при сохранении результата:', error);
    throw error;
  }
}

/**
 * Склонение слова "очко"
 */
function getPointsWord(points: number): string {
  const lastTwo = points % 100;
  const lastOne = points % 10;
  
  if (lastTwo >= 11 && lastTwo <= 19) {
    return 'очков';
  }
  
  if (lastOne === 1) {
    return 'очко';
  }
  
  if (lastOne >= 2 && lastOne <= 4) {
    return 'очка';
  }
  
  return 'очков';
}

/**
 * Проверка подписки на канал для получения бонуса
 */
export async function checkChannelSubscriptionBoost(
  participatingId: number
): Promise<CheckChannelSubscriptionBoostResponse> {
  if (!participatingId) {
    throw new Error('participatingId обязателен');
  }

  try {
    const response = await apiClient.post<CheckChannelSubscriptionBoostResponse>(
      '/attempt/check-channel-subscription-boost',
      { participatingId: String(participatingId) }
    );
    
    // @ts-expect-error - Vite добавляет env в import.meta
    if (import.meta.env.DEV) {
      console.log('Результат проверки подписки на канал:', response);
    }
    
    return response;
  } catch (error) {
    console.error('Ошибка при проверке подписки на канал:', error);
    throw error;
  }
}

/**
 * Проверка подписки на канал через user endpoint
 */
export async function checkUserChannelSubscriptionBoost(): Promise<CheckChannelSubscriptionBoostResponse> {
  try {
    const response = await apiClient.post<CheckChannelSubscriptionBoostResponse>(
      '/user/check-channel-subscription-boost',
      {}
    );
    
    // @ts-expect-error - Vite добавляет env в import.meta
    if (import.meta.env.DEV) {
      console.log('Результат проверки подписки на канал (user endpoint):', response);
    }
    
    return response;
  } catch (error) {
    console.error('Ошибка при проверке подписки на канал (user endpoint):', error);
    throw error;
  }
}

