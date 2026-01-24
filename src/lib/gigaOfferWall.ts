/**
 * Сервис для работы с GigaPub OfferWall SDK
 * Предоставляет задания (подписки, скачивания приложений и т.д.)
 */

import { getTelegramUserData, isTelegramWebApp } from './telegram';
import { verifyReward, type RewardClaimData } from '../api/services/rewardService';

const PROJECT_ID = '5315'; // Ваш project ID

// Расширение типов Window для глобальных объектов SDK
declare global {
  interface Window {
    loadOfferWallSDK?: (config: { projectId: string }) => Promise<any>;
    loadGigaSDKCallbacks?: Array<() => void>;
    gigaOfferWallSDK?: {
      open: () => void;
      close: () => void;
      confirmReward: (rewardId: string | number, hash: string) => Promise<boolean>;
      on: (event: string, handler: (data: any) => void) => void;
      off: (event: string, handler: (data: any) => void) => void;
    };
  }
}

/**
 * Инициализация GigaPub OfferWall SDK
 * Вызывается один раз при загрузке приложения
 * 
 * ВАЖНО: SDK требует данные пользователя Telegram, которые доступны только
 * когда приложение открыто внутри Telegram Web App. При локальной разработке
 * инициализация может не пройти.
 */
export function initOfferWallSDK(): void {
  // Проверяем, что мы в Telegram Web App
  if (!isTelegramWebApp()) {
    console.warn('[GigaOfferWall] Приложение не запущено в Telegram Web App. SDK будет работать только в продакшене.');
    return;
  }

  // Проверяем наличие данных пользователя
  const userData = getTelegramUserData();
  if (!userData) {
    console.warn('[GigaOfferWall] Данные пользователя Telegram недоступны. SDK будет работать только в продакшене.');
    return;
  }

  // Регистрируем callback для инициализации после загрузки SDK
  (window.loadGigaSDKCallbacks || (window.loadGigaSDKCallbacks = [])).push(() => {
    if (!window.loadOfferWallSDK) {
      console.error('[GigaOfferWall] loadOfferWallSDK не доступен');
      return;
    }

    console.log('[GigaOfferWall] Инициализация SDK с projectId:', PROJECT_ID);
    console.log('[GigaOfferWall] User ID:', userData.userTelegramId);

    window
      .loadOfferWallSDK({
        projectId: PROJECT_ID,
      })
      .then((sdk: any) => {
        console.log('[GigaOfferWall] SDK успешно загружен', sdk);
        
        // Сохраняем ссылку на SDK
        window.gigaOfferWallSDK = sdk;

        // Настраиваем обработчик событий наград
        // Это событие срабатывает, когда пользователь выполняет задание в OfferWall
        sdk.on('rewardClaim', handleRewardClaim);
      })
      .catch((error: Error) => {
        console.error('[GigaOfferWall] Ошибка загрузки SDK:', error);
        // В локальной разработке это нормально - SDK требует реальные данные Telegram
        if (import.meta.env?.DEV) {
          console.warn('[GigaOfferWall] Это нормально для локальной разработки. На продакшене должно работать.');
        }
      });
  });
}

/**
 * Открытие OfferWall с заданиями
 * 
 * ВАЖНО: Работает только в Telegram Web App с реальными данными пользователя.
 * При локальной разработке может не работать.
 */
export function openOfferWall(): void {
  // Проверяем, что мы в Telegram Web App
  if (!isTelegramWebApp()) {
    const message = import.meta.env?.DEV 
      ? 'Задания доступны только в Telegram Web App. Откройте приложение через Telegram для проверки.'
      : 'Задания доступны только в Telegram Web App.';
    alert(message);
    console.warn('[GigaOfferWall]', message);
    return;
  }

  // Проверяем наличие данных пользователя
  const userData = getTelegramUserData();
  if (!userData) {
    const message = import.meta.env?.DEV
      ? 'Данные пользователя недоступны. На продакшене это должно работать автоматически.'
      : 'Данные пользователя недоступны. Попробуйте позже.';
    alert(message);
    console.warn('[GigaOfferWall]', message);
    return;
  }

  if (!window.gigaOfferWallSDK) {
    console.warn('[GigaOfferWall] SDK еще не загружен, пробуем инициализировать...');
    
    // Пробуем инициализировать, если еще не инициализирован
    if (window.loadOfferWallSDK) {
      window
        .loadOfferWallSDK({ projectId: PROJECT_ID })
        .then((sdk: any) => {
          console.log('[GigaOfferWall] SDK инициализирован при открытии', sdk);
          window.gigaOfferWallSDK = sdk;
          
          // Настраиваем обработчик событий, если еще не настроен
          if (!sdk._eventsConfigured) {
            sdk.on('rewardClaim', handleRewardClaim);
            sdk._eventsConfigured = true;
          }
          
          sdk.open();
        })
        .catch((error: Error) => {
          console.error('[GigaOfferWall] Ошибка при открытии:', error);
          
          // В локальной разработке показываем понятное сообщение
          if (import.meta.env?.DEV) {
            alert('Задания работают только в Telegram Web App. Откройте приложение через Telegram для проверки.\n\nОшибка: ' + error.message);
          } else {
            alert('Не удалось загрузить задания. Попробуйте позже.');
          }
        });
    } else {
      console.error('[GigaOfferWall] Loader скрипт еще не загружен. Подождите немного и попробуйте снова.');
      alert('Задания загружаются. Подождите немного и попробуйте снова.');
    }
    return;
  }

  console.log('[GigaOfferWall] Открываем OfferWall...');
  try {
    window.gigaOfferWallSDK.open();
  } catch (error) {
    console.error('[GigaOfferWall] Ошибка при открытии OfferWall:', error);
    
    if (import.meta.env?.DEV) {
      alert('Задания работают только в Telegram Web App. Откройте приложение через Telegram для проверки.');
    } else {
      alert('Не удалось открыть задания. Попробуйте позже.');
    }
  }
}

/**
 * Обработчик события rewardClaim от GigaPub
 * Вызывается автоматически, когда пользователь выполняет задание в OfferWall
 * 
 * Flow:
 * 1. GigaPub проверяет выполнение задания (автоматически)
 * 2. GigaPub отправляет событие rewardClaim с данными о награде
 * 3. Фронтенд получает событие → вызывает этот обработчик
 * 4. Отправляем данные на бекенд для проверки и начисления награды
 * 5. Получаем confirmationHash от бекенда
 * 6. Подтверждаем награду в GigaPub через sdk.confirmReward()
 * 
 * @param data - Данные о выполненном задании от GigaPub
 */
/**
 * Обработчик события rewardClaim от GigaPub
 * Вызывается автоматически, когда пользователь выполняет задание в OfferWall
 * 
 * ВАЖНО: Пока бекенд готовится, мы только логируем события для проверки.
 * После готовности бекенда нужно будет раскомментировать отправку на бекенд.
 */
async function handleRewardClaim(data: any): Promise<void> {
  // ========== ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ СОБЫТИЯ ==========
  console.log('%c[GigaOfferWall] ====== СОБЫТИЕ: Задание выполнено! ======', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
  console.log('%c[GigaOfferWall] 📦 Сырые данные от GigaPub:', 'color: #2196F3; font-weight: bold;', data);
  
  // Выводим данные в удобном формате
  console.group('%c[GigaOfferWall] 📋 Детали события:', 'color: #FF9800; font-weight: bold;');
  console.log('rewardId:', data.rewardId);
  console.log('userId:', data.userId);
  console.log('projectId:', data.projectId);
  console.log('amount:', data.amount);
  console.log('hash:', data.hash);
  console.log('description:', data.description);
  console.log('Все данные (JSON):', JSON.stringify(data, null, 2));
  console.groupEnd();

  // Проверяем, что SDK доступен
  if (!window.gigaOfferWallSDK) {
    console.error('[GigaOfferWall] ❌ SDK недоступен для подтверждения награды');
    return;
  }

  // Преобразуем данные в формат RewardClaimData
  const rewardData: RewardClaimData = {
    rewardId: data.rewardId,
    userId: data.userId || String(data.userId),
    projectId: data.projectId || PROJECT_ID,
    hash: data.hash,
    amount: data.amount,
    description: data.description,
  };

  console.log('%c[GigaOfferWall] ✅ Обработанные данные награды (готовы для отправки на бекенд):', 'color: #4CAF50; font-weight: bold;', rewardData);
  console.log('%c[GigaOfferWall] 📤 Формат для отправки на бекенд (JSON):', 'color: #9C27B0; font-weight: bold;', JSON.stringify(rewardData, null, 2));

  // ========== ВРЕМЕННО: Только логируем, не отправляем на бекенд ==========
  // TODO: После готовности бекенда раскомментировать код ниже
  
  console.warn('%c[GigaOfferWall] ⚠️ ВНИМАНИЕ: Отправка на бекенд временно отключена для тестирования', 'color: #FF9800; font-weight: bold;');
  console.log('%c[GigaOfferWall] 📝 Данные, которые будут отправлены на бекенд:', 'color: #2196F3; font-weight: bold;');
  console.log('POST /reward/verify');
  console.log('Body:', JSON.stringify(rewardData, null, 2));
  
  // Показываем пользователю уведомление (без подтверждения в GigaPub)
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(
      `Задание выполнено! Получено: ${rewardData.amount} ${rewardData.description || 'награда'}\n\n(Награда будет начислена после проверки бекендом)`,
      () => {}
    );
  }

  // ========== КОД ДЛЯ ОТПРАВКИ НА БЕКЕНД (раскомментировать после готовности) ==========
  /*
  try {
    // ШАГ 1: Отправляем на бекенд для проверки и начисления награды
    console.log('[GigaOfferWall] Отправляем награду на бекенд для проверки...');
    const confirmationHash = await verifyReward(rewardData);

    if (!confirmationHash) {
      console.error('[GigaOfferWall] Бекенд не подтвердил награду');
      alert('Не удалось подтвердить награду. Обратитесь в поддержку.');
      return;
    }

    console.log('[GigaOfferWall] Бекенд подтвердил награду, confirmationHash:', confirmationHash);

    // ШАГ 2: Подтверждаем награду в GigaPub
    console.log('[GigaOfferWall] Подтверждаем награду в GigaPub...');
    const confirmed = await window.gigaOfferWallSDK.confirmReward(
      rewardData.rewardId,
      confirmationHash
    );

    if (confirmed) {
      console.log('[GigaOfferWall] ✅ Награда успешно подтверждена в GigaPub!');
      console.log('[GigaOfferWall] Пользователь получил:', rewardData.amount, rewardData.description || 'награда');
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(
          `Награда получена! Вы получили ${rewardData.amount} ${rewardData.description || 'награда'}`,
          () => {}
        );
      }
    } else {
      console.error('[GigaOfferWall] Ошибка подтверждения награды в GigaPub');
      alert('Ошибка подтверждения награды. Обратитесь в поддержку.');
    }
  } catch (error: any) {
    console.error('[GigaOfferWall] Ошибка при обработке награды:', error);
    alert('Произошла ошибка при обработке награды. Обратитесь в поддержку.');
  }
  */
}

/**
 * Проверка доступности SDK
 */
export function isOfferWallAvailable(): boolean {
  return !!window.gigaOfferWallSDK;
}

