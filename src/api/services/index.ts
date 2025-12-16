// Экспорт всех API сервисов
export { login, type AuthResponse, type AuthError } from './authService';
export { 
  checkPartnersSubscription, 
  type PartnerSubscriptionCheckRequest,
  type PartnerSubscriptionCheckResponse 
} from './partnersService';
export { 
  startDraw,
  type StartDrawResponse,
  type StartDrawValue,
  type Draw,
  type Game,
  type PrizeList,
  type PrizeListItem,
  type Prize
} from './drawService';
export {
  getLeaderboard,
  getLeaderboardPage,
  type LeaderboardResponse,
  type LeaderboardRequest,
  type LeaderboardUser,
  type LeaderboardValue
} from './leaderboardService';

