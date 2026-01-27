/**
 * Сервис для работы с наградами от GigaPub OfferWall
 * 
 * Структура данных основана на официальной документации GigaPub
 */

import { apiClient } from '../apiClient';

/**
 * Данные о выполненном задании от GigaPub
 * Структура основана на официальной документации GigaPub
 */
export interface RewardClaimData {
  rewardId: string | number;      // ID награды в GigaPub
  userId: string;                  // ID пользователя (Telegram ID)
  projectId: string | number;     // Project ID (5315)
  amount: number;                  // Количество награды (попыток/звезд)
  hash: string;                    // Хеш для проверки подлинности
  // Примечание: description может быть в данных события, но не требуется для verify-reward
  description?: string;            // Описание задания (опционально)
}

/**
 * Запрос на проверку и подтверждение награды
 * Структура согласно официальной документации GigaPub
 * Endpoint: POST /verify-reward
 */
export interface VerifyRewardRequest {
  rewardId: string | number;
  userId: string;
  projectId: string | number;
  amount: number;
  hash: string;
  // description не отправляется на бекенд согласно документации
}

/**
 * Ответ от бекенда после проверки награды
 * Структура согласно официальной документации GigaPub
 */
export interface VerifyRewardResponse {
  success: boolean;               // В документации: success (не isSuccess)
  confirmationHash?: string;       // Хеш для подтверждения в GigaPub
  error?: string;                  // Ошибка (если success: false)
}

/**
 * Проверка и подтверждение награды на бекенде
 * 
 * Структура запроса согласно официальной документации GigaPub:
 * - Endpoint: POST /verify-reward
 * - Body: { rewardId, userId, projectId, amount, hash }
 * 
 * Формула проверки hash на бекенде (согласно документации):
 * sha1(`${userId}:${projectId}:${rewardId}:${amount}:${secretKey}`)
 * 
 * Формула генерации confirmationHash (согласно документации):
 * sha1(`${rewardId}:${userId}:${projectId}:${amount}:confirm:${secretKey}`)
 * 
 * @param rewardData - Данные о выполненном задании от GigaPub
 * @returns confirmationHash для подтверждения в GigaPub или null при ошибке
 */
export async function verifyReward(
  rewardData: RewardClaimData
): Promise<string | null> {
  try {
    // Формируем запрос согласно официальной документации GigaPub
    // description не отправляется на бекенд
    const request: VerifyRewardRequest = {
      rewardId: rewardData.rewardId,
      userId: rewardData.userId,
      projectId: rewardData.projectId,
      amount: rewardData.amount,
      hash: rewardData.hash,
    };

    console.log('[RewardService] Отправляем награду на проверку (согласно документации GigaPub):', request);
    console.log('[RewardService] Endpoint: POST /verify-reward');

    // Endpoint согласно официальной документации: /verify-reward
    const response = await apiClient.post<VerifyRewardResponse>(
      '/verify-reward',
      request
    );

    // В документации используется success (не isSuccess)
    if (response.success && response.confirmationHash) {
      console.log('[RewardService] Награда подтверждена, confirmationHash:', response.confirmationHash);
      return response.confirmationHash;
    } else {
      console.error('[RewardService] Ошибка подтверждения награды:', response.error);
      return null;
    }
  } catch (error: any) {
    console.error('[RewardService] Ошибка при отправке награды на бекенд:', error);
    return null;
  }
}

