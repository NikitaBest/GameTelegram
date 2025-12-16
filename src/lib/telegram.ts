// Простые утилиты для работы внутри Telegram WebApp

import { getStartParam } from '../utils/urlParams';

export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  // @ts-expect-error: глобальный объект Telegram приходит снаружи
  return Boolean(window.Telegram && window.Telegram.WebApp);
}

export function getStableViewportHeight(): number {
  if (typeof window === 'undefined') return 600;

  // @ts-expect-error: Telegram typings отсутствуют
  const tg = window.Telegram?.WebApp;
  const fromTelegram =
    tg?.viewportStableHeight || tg?.viewportHeight || tg?.MainButton?.height;

  return typeof fromTelegram === 'number' && fromTelegram > 0
    ? fromTelegram
    : window.innerHeight || 600;
}

// Интерфейс для данных пользователя Telegram
export interface TelegramUserData {
  userTelegramId: number;
  firstName: string;
  lastName: string | null;
  userName: string | null;
  addedToAttachmentMenu: boolean;
  allowsWriteToPm: boolean;
  ignoreValidate: boolean;
  initData: string;
  isPremium: boolean;
  languageCode: string;
  photoUrl: string | null;
  utm?: string;
}

// Получение данных пользователя из Telegram Web App
export function getTelegramUserData(): TelegramUserData | null {
  if (typeof window === 'undefined') return null;
  
  // @ts-expect-error: глобальный объект Telegram приходит снаружи
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;

  // Получаем полный initData с хешем - это критически важно для валидации на бекенде
  const initData = tg.initData || '';
  
  // Проверяем наличие хеша в initData
  const hasHash = initData.includes('hash=');
  
  // Если нет initData, не можем авторизоваться
  if (!initData) {
    console.warn('initData не доступен в Telegram Web App');
    return null;
  }
  
  // Предупреждаем, если нет хеша (но продолжаем работу)
  // @ts-ignore - import.meta.env доступен в Vite
  if (!hasHash && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn('ВНИМАНИЕ: initData не содержит хеш. Это может вызвать ошибку на бекенде.');
    console.log('initData:', initData);
  }

  const user = tg.initDataUnsafe?.user;
  if (!user) {
    console.warn('Данные пользователя не доступны в initDataUnsafe');
    return null;
  }

  // Получаем параметр из URL или Telegram Web App
  // Приоритет: сначала URL, потом Telegram
  const startParam = getStartParam();

  return {
    userTelegramId: user.id,
    firstName: user.first_name || '',
    lastName: user.last_name || null,
    userName: user.username || null,
    addedToAttachmentMenu: Boolean(startParam || tg.initDataUnsafe?.start_param),
    allowsWriteToPm: true, // По умолчанию
    ignoreValidate: false,
    initData: initData, // Полный initData с хешем
    isPremium: user.is_premium || false,
    languageCode: user.language_code || 'ru',
    photoUrl: user.photo_url || null,
    utm: startParam || tg.initDataUnsafe?.start_param || undefined,
  };
}

// Тестовые данные для локальной разработки
// ВАЖНО: Для локальной разработки используем ignoreValidate: true, так как у нас нет валидного хеша
// Формат данных соответствует Swagger API
export function getMockTelegramUserData(): TelegramUserData {
  // Формируем initData без хеша (для тестирования)
  // В реальном Telegram Web App initData содержит хеш автоматически
  const mockInitData = 'user=%7B%22id%22%3A1343546686%2C%22first_name%22%3A%22%D0%9D%D0%B8%D0%BA%D0%B8%D1%82%D0%B0%22%2C%22last_name%22%3A%22%D0%91%D0%B5%D1%81%D1%81%D0%BE%D0%BD%D0%BE%D0%B2%22%2C%22username%22%3A%22bessonovnikita%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%7D';
  
  // Получаем параметр из URL для тестирования
  // В реальном приложении это будет работать автоматически
  const startParam = getStartParam();
  
  // Формат данных точно соответствует Swagger:
  // Порядок полей соответствует документации для удобства сравнения
  return {
    userTelegramId: 1343546686,        // number (обязательное)
    firstName: 'Никита',               // string (обязательное)
    lastName: 'Бессонов',              // string (обязательное)
    userName: 'bessonovnikita',        // string (обязательное)
    photoUrl: '',                       // string (опциональное, можно пустую строку)
    initData: mockInitData,            // string (обязательное)
    languageCode: 'ru',                // string (обязательное)
    isPremium: true,                   // boolean (обязательное)
    addedToAttachmentMenu: Boolean(startParam), // boolean (обязательное)
    allowsWriteToPm: true,             // boolean (обязательное)
    ignoreValidate: true,              // boolean (обязательное) - для локальной разработки
    utm: startParam || '72',           // string (опциональное) - используем параметр из URL если есть
  };
}


