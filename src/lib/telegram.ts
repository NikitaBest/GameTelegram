// Простые утилиты для работы внутри Telegram WebApp

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


