import { apiClient } from '../apiClient';

export interface PartnerSubscriptionCheckRequest {
  drawId: number;
}

export interface Partner {
  partnerId: number;
  subscribed: boolean;
  name: string;
  description: string;
  link: string;
  userName: string;
}

export interface PartnersSubscriptionValue {
  success: boolean;
  items: Partner[];
}

export interface PartnerSubscriptionCheckResponse {
  value: PartnersSubscriptionValue;
  isSuccess: boolean;
  error: string;
}

/**
 * Проверка подписок на партнерские каналы для розыгрыша
 * 
 * @param drawId - ID розыгрыша
 * @returns Данные о подписках на партнерские каналы
 */
export async function checkPartnersSubscription(
  drawId: number
): Promise<PartnerSubscriptionCheckResponse> {
  if (!drawId) {
    throw new Error('drawId обязателен для проверки подписок');
  }

  try {
    const response = await apiClient.post<PartnerSubscriptionCheckResponse>(
      '/participating/check-partners-subscription',
      { drawId }
    );
    
    return response;
  } catch (error) {
    console.error('Ошибка при проверке подписок партнеров:', error);
    throw error;
  }
}

