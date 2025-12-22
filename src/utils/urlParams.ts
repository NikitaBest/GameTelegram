/**
 * Утилиты для работы с URL параметрами
 */

export interface ParsedStartParam {
  drawId: number | null; // ID розыгрыша (число в начале параметра)
  utm: string; // Полное значение параметра для передачи в запрос
  hasParam: boolean; // Флаг наличия параметра
}

/**
 * Получение параметра tgWebAppStartParam или startapp из URL
 * Параметр может быть в формате: "33_utm-channel" или просто "33"
 * Где число в начале - это ID розыгрыша
 * 
 * @returns Полное значение параметра или null
 */
export function getStartParamFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  // Проверяем оба варианта параметра: tgWebAppStartParam (Telegram) и startapp (для тестирования)
  return urlParams.get('tgWebAppStartParam') || urlParams.get('startapp');
}

/**
 * Получение параметра из Telegram Web App
 * Если приложение запущено в Telegram, параметр может быть в initDataUnsafe.start_param
 * 
 * @returns Полное значение параметра или null
 */
export function getStartParamFromTelegram(): string | null {
  if (typeof window === 'undefined') return null;
  
  // @ts-expect-error: глобальный объект Telegram приходит снаружи
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;
  
  return tg.initDataUnsafe?.start_param || null;
}

/**
 * Получение параметра tgWebAppStartParam из любого доступного источника
 * Приоритет: сначала URL, потом Telegram Web App
 * 
 * @returns Полное значение параметра или null
 */
export function getStartParam(): string | null {
  // Сначала проверяем URL
  const urlParam = getStartParamFromURL();
  if (urlParam) {
    return urlParam;
  }
  
  // Если в URL нет, проверяем Telegram Web App
  const telegramParam = getStartParamFromTelegram();
  if (telegramParam) {
    return telegramParam;
  }
  
  return null;
}

/**
 * Парсинг параметра tgWebAppStartParam
 * Формат: "число_строка" или просто "число"
 * Примеры: "33_utm-channel", "33"
 * 
 * @param param - Полное значение параметра
 * @returns Объект с ID розыгрыша и полным значением для utm
 */
export function parseStartParam(param: string | null): ParsedStartParam {
  if (!param || param.trim().length === 0) {
    return {
      drawId: null,
      utm: '',
      hasParam: false,
    };
  }

  // Пытаемся найти число в начале строки
  // Формат: число_остальное или просто число
  const match = param.match(/^(\d+)(?:_(.+))?$/);
  
  if (match) {
    const drawId = parseInt(match[1], 10);
    return {
      drawId: isNaN(drawId) ? null : drawId,
      utm: param, // Полное значение параметра для utm
      hasParam: true,
    };
  }

  // Если формат не соответствует ожидаемому, все равно возвращаем значение для utm
  return {
    drawId: null,
    utm: param,
    hasParam: true,
  };
}

/**
 * Получение и парсинг параметра tgWebAppStartParam
 * 
 * @returns Объект с ID розыгрыша и полным значением для utm
 */
export function getParsedStartParam(): ParsedStartParam {
  const param = getStartParam();
  return parseStartParam(param);
}

