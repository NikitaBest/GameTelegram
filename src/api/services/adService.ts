import { apiClient } from '../apiClient';

interface ViewAdResponse {
  isSuccess: boolean;
  value?: {
    success: boolean;
    attemptsAdded: number;
  };
  error?: string;
}

/**
 * Отправляет запрос о просмотре рекламы для получения дополнительной попытки
 */
export async function viewAd(participatingId: string): Promise<ViewAdResponse> {
  return apiClient.post<ViewAdResponse>('/participating/view-ad', {
    participatingId,
  });
}

