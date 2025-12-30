import { apiClient } from '../apiClient';

export interface Prize {
  type: number;
  value: string;
  name: string;
  comment: string;
  id: number;
  createdAt: string;
}

export interface PrizeListItem {
  startPosition: number;
  endPosition: number;
  countWinner: number;
  prizeId: number;
  prize: Prize;
  prizeListId: number;
  allWinners: boolean;
  id: number;
  createdAt: string;
}

export interface PrizeList {
  name: string;
  description: string;
  items: PrizeListItem[];
  id: number;
  createdAt: string;
}

export interface Partner {
  name: string;
  telegramId: number;
  userName: string | null;
  isActive: boolean;
  link: string;
  description: string | null;
  conditions: string | null;
  invitedCount: number;
  isBot: boolean;
  botToken: string | null;
  botStatApiKey: string | null;
  subscriptions: any[];
  id: number;
  createdAt: string;
}

export interface DrawPartner {
  drawId: number;
  partnerId: number;
  partner: Partner;
  priority: number;
  id: number;
  createdAt: string;
}

export interface Game {
  name: string;
  description: string;
  rules: string;
  gameControlDescription: string;
  pointConditionDescription: string;
  link: string;
  id: number;
  createdAt: string;
}

export interface Draw {
  gameId: number;
  game: Game | null;
  name: string;
  description: string;
  link: string;
  start: string;
  secondsToStart: number;
  end: string;
  secondsToEnd: number;
  awardDateTime: string;
  prizeListId: number;
  prizeList: PrizeList;
  attemptsCount: number;
  hasAwarding: boolean;
  channelPostMessageId: number;
  starsDistributionAmount: number;
  partners: DrawPartner[];
  isActive: boolean;
  id: number;
  createdAt: string;
}

export interface StartDrawValue {
  gameId: number;
  game: Game;
  userId: number;
  user: any | null;
  drawId: number;
  draw: Draw;
  attemptsCount: number;
  isPartnerSubscribed: boolean;
  isViewedAds: boolean;
  isPassedTask: boolean;
  countPassedTask: number;
  isInvitedFriends: boolean;
  countInvitedFriends: number;
  maxAttemptsCount: number;
  maxPoints: number | null;
  maxPointsDate: string | null;
  maxPointsAlias: string | null;
  referralCode: string;
  referralsCount: number;
  status: number;
  referralLink: string;
  channelSubscriptionBoosted: boolean | null;
  id: number;
  createdAt: string;
}

export interface StartDrawResponse {
  value: StartDrawValue;
  isSuccess: boolean;
  error: string;
}

/**
 * Получение данных о розыгрыше для начала игры
 * 
 * @param drawId - ID розыгрыша
 * @returns Данные о розыгрыше, игре, призах и статусе пользователя
 */
export async function startDraw(drawId: number): Promise<StartDrawResponse> {
  if (!drawId) {
    throw new Error('drawId обязателен для начала розыгрыша');
  }

  try {
    const response = await apiClient.post<StartDrawResponse>(
      '/participating/start',
      { drawId }
    );
    
    return response;
  } catch (error) {
    console.error('Ошибка при получении данных розыгрыша:', error);
    throw error;
  }
}

