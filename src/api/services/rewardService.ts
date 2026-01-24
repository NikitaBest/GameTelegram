/**
 * Сервис для работы с наградами от GigaPub OfferWall
 */

import { apiClient } from '../apiClient';

/**
 * Данные о выполненном задании от GigaPub
 */
export interface RewardClaimData {
  rewardId: string | number;      // ID награды в GigaPub
  userId: string;              // ID пользователя (Telegram ID)
  projectId: string | number;    // Project ID (5315)
  hash: string;                  // Хеш для проверки подлинности
  amount: number;                // Количество награды (попыток/звезд)
  description?: string;          // Описание задания
}

/**
 * Запрос на проверку и подтверждение награды
 */
export interface VerifyRewardRequest {
  rewardId: string | number;
  userId: string;
  projectId: string | number;
  amount: number;
  hash: string;
  description?: string;
}

/**
 * Ответ от бекенда после проверки награды
 */
export interface VerifyRewardResponse {
  isSuccess: boolean;
  confirmationHash?: string;     // Хеш для подтверждения в GigaPub
  error?: string;
  message?: string;
}

/**
 * Проверка и подтверждение награды на бекенде
 * 
 * @param rewardData - Данные о выполненном задании от GigaPub
 * @returns confirmationHash для подтверждения в GigaPub или null при ошибке
 */
export async function verifyReward(
  rewardData: RewardClaimData
): Promise<string | null> {
  try {
    const request: VerifyRewardRequest = {
      rewardId: rewardData.rewardId,
      userId: rewardData.userId,
      projectId: rewardData.projectId,
      amount: rewardData.amount,
      hash: rewardData.hash,
      description: rewardData.description,
    };

    console.log('[RewardService] Отправляем награду на проверку:', request);

    const response = await apiClient.post<VerifyRewardResponse>(
      '/reward/verify',
      request
    );

    if (response.isSuccess && response.confirmationHash) {
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

