import { apiClient } from '../apiClient';

export interface ActiveDraw {
  id: number;
  name: string;
  description: string;
  link: string;
  start: string;
  secondsToStart: number;
  end: string;
  secondsToEnd: number;
  awardDateTime: string | null;
  prizeListId: number;
  prizeList: {
    name: string;
    description: string;
    items: Array<{
      startPosition: number;
      endPosition: number;
      countWinner: number;
      prizeId: number;
      prize: {
        type: number;
        value: string;
        name: string;
        comment: string;
        id: number;
      };
    }>;
  };
  attemptsCount: number;
  hasAwarding: boolean;
  isActive: boolean;
  gameId: number;
  game: {
    name: string;
    description: string;
    id: number;
  };
  participating: {
    maxPoints: number | null;
    maxPointsAlias: string | null;
    attemptsCount: number;
    maxAttemptsCount: number;
  } | null;
  hasParticipating: boolean;
  hasAttempts: boolean;
  hasSubscription: boolean;
}

export interface ActiveDrawsResponse {
  value: ActiveDraw[];
  isSuccess: boolean;
  error: string | null;
}

/**
 * Получение списка активных розыгрышей
 */
export async function getActiveDraws(): Promise<ActiveDrawsResponse> {
  try {
    const response = await apiClient.get<ActiveDrawsResponse>('/draw/active');
    return response;
  } catch (error) {
    console.error('Ошибка при получении активных розыгрышей:', error);
    throw error;
  }
}

