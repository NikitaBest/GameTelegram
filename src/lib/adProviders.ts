/**
 * Абстракция для работы с разными рекламными партнерами
 * Поддерживает Adextra и GigaPub
 */

// Расширение типов Window для глобальных объектов SDK
declare global {
  interface Window {
    // Adextra SDK
    adextra_onInit_callbacks?: Array<(showFn: (onSuccess: () => void, onError: () => void) => void) => void>;
    adextra_onInit_fallbacks?: Array<() => void>;
    p_adextra?: (onSuccess: () => void, onError: () => void) => void;
    
    // GigaPub SDK
    showGiga?: () => Promise<void>;
  }
}

export type AdProvider = 'adextra' | 'gigapub';

export interface AdProviderConfig {
  provider: AdProvider;
  projectId?: string; // Для GigaPub
}

/**
 * Универсальный интерфейс для показа рекламы
 */
export interface AdShowResult {
  success: boolean;
  error?: string;
}

/**
 * Инициализация Adextra SDK
 */
export function initAdextra(onInit: (showFn: (onSuccess: () => void, onError: () => void) => void) => void) {
  // Регистрируем callback для инициализации
  if (!window.adextra_onInit_callbacks) {
    window.adextra_onInit_callbacks = [];
  }
  window.adextra_onInit_callbacks.push(onInit);

  // Проверяем, может SDK уже инициализирован
  if (typeof window.p_adextra === 'function') {
    onInit(window.p_adextra);
  }
}

/**
 * Инициализация GigaPub SDK
 */
export function initGigaPub(onInit: (showFn: () => Promise<void>) => void): () => void {
  let checkInterval: NodeJS.Timeout | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  // GigaPub использует window.showGiga() как Promise
  // Проверяем, доступен ли SDK
  if (typeof window.showGiga === 'function') {
    onInit(window.showGiga);
  } else {
    // Ждем загрузки SDK
    checkInterval = setInterval(() => {
      if (typeof window.showGiga === 'function') {
        if (checkInterval) clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
        onInit(window.showGiga);
      }
    }, 100);

    // Таймаут на случай, если SDK не загрузится
    timeoutId = setTimeout(() => {
      if (checkInterval) clearInterval(checkInterval);
    }, 10000);
  }

  // Cleanup функция
  return () => {
    if (checkInterval) clearInterval(checkInterval);
    if (timeoutId) clearTimeout(timeoutId);
  };
}

/**
 * Показ рекламы через Adextra
 */
export function showAdextraAd(
  showFn: (onSuccess: () => void, onError: () => void) => void,
  onSuccess: () => void,
  onError: () => void
): void {
  showFn(onSuccess, onError);
}

/**
 * Показ рекламы через GigaPub
 */
export async function showGigaPubAd(
  showFn: () => Promise<void>,
  onSuccess: () => void,
  onError: () => void
): Promise<void> {
  try {
    await showFn();
    onSuccess();
  } catch (error) {
    console.error('GigaPub ad error:', error);
    onError();
  }
}

/**
 * Универсальная функция инициализации рекламного провайдера
 */
export function initAdProvider(
  provider: AdProvider,
  onInit: (showFn: any) => void
): () => void {
  if (provider === 'adextra') {
    initAdextra(onInit);
    // Cleanup функция для Adextra
    return () => {
      // Cleanup для Adextra (если нужно)
    };
  } else if (provider === 'gigapub') {
    // initGigaPub возвращает cleanup функцию
    return initGigaPub(onInit);
  }

  return () => {};
}

/**
 * Универсальная функция показа рекламы
 */
export async function showAd(
  provider: AdProvider,
  showFn: any,
  onSuccess: () => void,
  onError: () => void
): Promise<void> {
  if (provider === 'adextra') {
    showAdextraAd(showFn, onSuccess, onError);
  } else if (provider === 'gigapub') {
    await showGigaPubAd(showFn, onSuccess, onError);
  }
}

