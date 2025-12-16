// Экспорт всех API сервисов
export { login, type AuthResponse, type AuthError } from './authService';
export { 
  checkPartnersSubscription, 
  type PartnerSubscriptionCheckRequest,
  type PartnerSubscriptionCheckResponse 
} from './partnersService';

