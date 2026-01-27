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
      pending?: () => Promise<any[]>; // Метод для получения наград, ожидающих подтверждения
      hasOffers?: () => Promise<boolean> | boolean;
      getOffersCount?: () => Promise<number> | number;
      checkAvailability?: () => Promise<boolean>;
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

        // Проверяем pending rewards (награды, ожидающие подтверждения)
        // Это полезно для восстановления после прерванных сессий
        checkPendingRewards(sdk);

        // Настраиваем обработчик событий закрытия OfferWall
        // После закрытия проверяем наличие заданий заново
        try {
          sdk.on('close', () => {
            console.log('[GigaOfferWall] OfferWall закрыт, проверяем наличие заданий...');
            // Триггерим событие для обновления состояния в компоненте
            window.dispatchEvent(new CustomEvent('gigaOfferWallClosed'));
          });
        } catch (e) {
          // Событие может не поддерживаться, это нормально
        }

        // Настраиваем обработчик событий изменения доступности заданий (если доступен)
        try {
          sdk.on('offersUpdated', () => {
            console.log('[GigaOfferWall] Событие: задания обновлены');
            // Триггерим событие для обновления состояния в компоненте
            window.dispatchEvent(new CustomEvent('gigaOfferWallUpdated'));
          });
        } catch (e) {
          // Событие может не поддерживаться, это нормально
        }
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
          
          // Проверяем pending rewards при открытии OfferWall
          checkPendingRewards(sdk);
          
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
 * Валидация данных события rewardClaim
 * Проверяет наличие всех необходимых полей и их типы
 * 
 * @param data - Данные события от GigaPub
 * @returns Объект с результатом валидации
 */
function validateRewardData(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка обязательных полей
  if (!data.rewardId) {
    errors.push('Отсутствует поле: rewardId');
  } else if (typeof data.rewardId !== 'string' && typeof data.rewardId !== 'number') {
    errors.push('Поле rewardId должно быть string или number');
  }

  if (!data.userId) {
    errors.push('Отсутствует поле: userId');
  } else if (typeof data.userId !== 'string' && typeof data.userId !== 'number') {
    errors.push('Поле userId должно быть string или number');
  }

  if (!data.projectId) {
    warnings.push('Отсутствует поле: projectId (будет использован PROJECT_ID)');
  } else if (typeof data.projectId !== 'string' && typeof data.projectId !== 'number') {
    warnings.push('Поле projectId должно быть string или number');
  }

  if (data.amount === undefined || data.amount === null) {
    errors.push('Отсутствует поле: amount');
  } else if (typeof data.amount !== 'number') {
    errors.push('Поле amount должно быть number');
  } else if (data.amount <= 0) {
    warnings.push('Поле amount должно быть больше 0');
  }

  if (!data.hash) {
    errors.push('Отсутствует поле: hash');
  } else if (typeof data.hash !== 'string') {
    errors.push('Поле hash должно быть string');
  } else if (data.hash.length < 10) {
    warnings.push('Поле hash слишком короткое (возможно, некорректное)');
  }

  // Проверка опциональных полей
  if (data.description !== undefined && typeof data.description !== 'string') {
    warnings.push('Поле description должно быть string');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Обработчик события rewardClaim от GigaPub
 * Вызывается автоматически, когда пользователь выполняет задание в OfferWall
 * 
 * Flow:
 * 1. GigaPub проверяет выполнение задания (автоматически)
 * 2. GigaPub отправляет событие rewardClaim с данными о награде
 * 3. Фронтенд получает событие → вызывает этот обработчик
 * 4. Валидируем данные на фронтенде
 * 5. Отправляем данные на бекенд для проверки и начисления награды
 * 6. Получаем confirmationHash от бекенда
 * 7. Подтверждаем награду в GigaPub через sdk.confirmReward()
 * 
 * @param data - Данные о выполненном задании от GigaPub
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
  console.log('Все ключи объекта:', Object.keys(data));
  console.groupEnd();

  // ========== ВАЛИДАЦИЯ ДАННЫХ ==========
  console.group('%c[GigaOfferWall] ✅ Валидация данных:', 'color: #4CAF50; font-weight: bold;');
  const validation = validateRewardData(data);
  
  if (validation.isValid) {
    console.log('%c✅ Все обязательные поля присутствуют и имеют правильные типы', 'color: #4CAF50; font-weight: bold;');
  } else {
    console.error('%c❌ Ошибки валидации:', 'color: #F44336; font-weight: bold;', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('%c⚠️ Предупреждения:', 'color: #FF9800; font-weight: bold;', validation.warnings);
  }
  console.groupEnd();

  // Если есть критические ошибки, прекращаем обработку
  if (!validation.isValid) {
    console.error('[GigaOfferWall] ❌ Данные не прошли валидацию, обработка прервана');
    return;
  }

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

  // ========== ИНФОРМАЦИЯ ДЛЯ ПРОВЕРКИ НА БЕКЕНДЕ ==========
  console.group('%c[GigaOfferWall] 🔐 Информация для проверки на бекенде:', 'color: #9C27B0; font-weight: bold;');
  console.log('Формула проверки hash (согласно документации GigaPub):');
  console.log(`sha1(\`\${userId}:\${projectId}:\${rewardId}:\${amount}:\${secretKey}\`)`);
  console.log('Пример для ваших данных:');
  console.log(`sha1("${rewardData.userId}:${rewardData.projectId}:${rewardData.rewardId}:${rewardData.amount}:SECRET_KEY")`);
  console.log('Полученный hash:', rewardData.hash);
  console.log('Длина hash:', rewardData.hash.length, 'символов');
  console.log('Формат hash:', /^[a-f0-9]+$/i.test(rewardData.hash) ? 'hex (корректный)' : 'не hex (возможно некорректный)');
  console.groupEnd();

  // ========== ВРЕМЕННО: Только логируем, не отправляем на бекенд ==========
  // TODO: После готовности бекенда раскомментировать код ниже
  
  console.warn('%c[GigaOfferWall] ⚠️ ВНИМАНИЕ: Отправка на бекенд временно отключена для тестирования', 'color: #FF9800; font-weight: bold;');
  console.log('%c[GigaOfferWall] 📝 Данные, которые будут отправлены на бекенд (согласно документации GigaPub):', 'color: #2196F3; font-weight: bold;');
  console.log('POST /verify-reward');
  console.log('Body (без description, согласно документации):', JSON.stringify({
    rewardId: rewardData.rewardId,
    userId: rewardData.userId,
    projectId: rewardData.projectId,
    amount: rewardData.amount,
    hash: rewardData.hash
  }, null, 2));
  
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
 * Проверка и обработка pending rewards (наград, ожидающих подтверждения)
 * 
 * Метод sdk.pending() позволяет получить награды, которые были получены,
 * но еще не подтверждены. Это полезно для восстановления после прерванных сессий.
 * 
 * Согласно документации GigaPub:
 * - Вызывается при инициализации SDK
 * - Обрабатывает награды, которые не были подтверждены ранее
 * 
 * @param sdk - Экземпляр GigaPub SDK
 */
async function checkPendingRewards(sdk: any): Promise<void> {
  // Проверяем, доступен ли метод pending
  if (typeof sdk.pending !== 'function') {
    console.log('[GigaOfferWall] Метод pending() недоступен в SDK');
    return;
  }

  try {
    console.log('[GigaOfferWall] Проверяем pending rewards (награды, ожидающие подтверждения)...');
    
    // Получаем список наград, ожидающих подтверждения
    const pendingRewards = await sdk.pending();
    
    if (!pendingRewards || pendingRewards.length === 0) {
      console.log('[GigaOfferWall] Нет pending rewards');
      return;
    }

    console.log(`[GigaOfferWall] Найдено ${pendingRewards.length} pending reward(s):`, pendingRewards);

    // Обрабатываем каждую награду
    for (const reward of pendingRewards) {
      console.log('[GigaOfferWall] Обрабатываем pending reward:', reward);
      
      // Преобразуем в формат RewardClaimData
      const rewardData: RewardClaimData = {
        rewardId: reward.rewardId,
        userId: reward.userId || String(reward.userId),
        projectId: reward.projectId || PROJECT_ID,
        hash: reward.hash,
        amount: reward.amount,
        description: reward.description,
      };

      // Обрабатываем награду (отправляем на бекенд и подтверждаем)
      await processPendingReward(rewardData, sdk);
    }
  } catch (error: any) {
    console.error('[GigaOfferWall] Ошибка при проверке pending rewards:', error);
  }
}

/**
 * Обработка одной pending reward
 * 
 * @param rewardData - Данные награды
 * @param sdk - Экземпляр GigaPub SDK
 */
async function processPendingReward(rewardData: RewardClaimData, sdk: any): Promise<void> {
  try {
    console.log('%c[GigaOfferWall] ====== PENDING REWARD: Награда, ожидающая подтверждения ======', 'color: #FF9800; font-size: 14px; font-weight: bold;');
    console.log('[GigaOfferWall] Обрабатываем pending reward:', rewardData);

    // Валидация данных pending reward
    console.group('%c[GigaOfferWall] ✅ Валидация pending reward:', 'color: #4CAF50; font-weight: bold;');
    const validation = validateRewardData(rewardData);
    
    if (validation.isValid) {
      console.log('%c✅ Все обязательные поля присутствуют и имеют правильные типы', 'color: #4CAF50; font-weight: bold;');
    } else {
      console.error('%c❌ Ошибки валидации:', 'color: #F44336; font-weight: bold;', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('%c⚠️ Предупреждения:', 'color: #FF9800; font-weight: bold;', validation.warnings);
    }
    console.groupEnd();

    // Информация для проверки на бекенде
    console.group('%c[GigaOfferWall] 🔐 Информация для проверки pending reward на бекенде:', 'color: #9C27B0; font-weight: bold;');
    console.log('Формула проверки hash:');
    console.log(`sha1(\`\${userId}:\${projectId}:\${rewardId}:\${amount}:\${secretKey}\`)`);
    console.log('Пример для ваших данных:');
    console.log(`sha1("${rewardData.userId}:${rewardData.projectId}:${rewardData.rewardId}:${rewardData.amount}:SECRET_KEY")`);
    console.log('Полученный hash:', rewardData.hash);
    console.groupEnd();

    // ВРЕМЕННО: Только логируем, не отправляем на бекенд
    // TODO: После готовности бекенда раскомментировать код ниже
    console.warn('%c[GigaOfferWall] ⚠️ Pending reward найдена, но отправка на бекенд временно отключена', 'color: #FF9800; font-weight: bold;');
    console.log('%c[GigaOfferWall] 📝 Данные pending reward для отправки на бекенд:', 'color: #2196F3; font-weight: bold;');
    console.log('POST /verify-reward');
    console.log('Body:', JSON.stringify({
      rewardId: rewardData.rewardId,
      userId: rewardData.userId,
      projectId: rewardData.projectId,
      amount: rewardData.amount,
      hash: rewardData.hash
    }, null, 2));

    // ========== КОД ДЛЯ ОТПРАВКИ НА БЕКЕНД (раскомментировать после готовности) ==========
    /*
    // ШАГ 1: Отправляем на бекенд для проверки и начисления награды
    console.log('[GigaOfferWall] Отправляем pending reward на бекенд для проверки...');
    const confirmationHash = await verifyReward(rewardData);

    if (!confirmationHash) {
      console.error('[GigaOfferWall] Бекенд не подтвердил pending reward');
      return;
    }

    console.log('[GigaOfferWall] Бекенд подтвердил pending reward, confirmationHash:', confirmationHash);

    // ШАГ 2: Подтверждаем награду в GigaPub
    console.log('[GigaOfferWall] Подтверждаем pending reward в GigaPub...');
    const confirmed = await sdk.confirmReward(
      rewardData.rewardId,
      confirmationHash
    );

    if (confirmed) {
      console.log('[GigaOfferWall] ✅ Pending reward успешно подтверждена в GigaPub!');
    } else {
      console.error('[GigaOfferWall] Ошибка подтверждения pending reward в GigaPub');
    }
    */
  } catch (error: any) {
    console.error('[GigaOfferWall] Ошибка при обработке pending reward:', error);
  }
}

/**
 * Проверка доступности SDK
 */
export function isOfferWallAvailable(): boolean {
  return !!window.gigaOfferWallSDK;
}

/**
 * Проверка наличия заданий для пользователя
 * 
 * Проверяет, есть ли доступные задания в OfferWall для текущего пользователя.
 * Использует различные методы SDK в зависимости от доступности.
 * 
 * @returns Promise<boolean> - true если есть задания, false если нет
 */
export async function hasAvailableTasks(): Promise<boolean> {
  // Проверяем, что мы в Telegram Web App
  if (!isTelegramWebApp()) {
    console.log('[GigaOfferWall] Не в Telegram Web App, задания недоступны');
    return false;
  }

  // Проверяем наличие данных пользователя
  const userData = getTelegramUserData();
  if (!userData) {
    console.log('[GigaOfferWall] Данные пользователя недоступны, задания недоступны');
    return false;
  }

  // Если SDK еще не загружен, пробуем инициализировать
  if (!window.gigaOfferWallSDK) {
    // Если loader еще не загружен, возвращаем false (ждем загрузки)
    if (!window.loadOfferWallSDK) {
      console.log('[GigaOfferWall] Loader SDK еще не загружен');
      return false;
    }

    // Пробуем инициализировать SDK
    try {
      const sdk = await window.loadOfferWallSDK({ projectId: PROJECT_ID });
      window.gigaOfferWallSDK = sdk;
      
      // Настраиваем обработчик событий, если еще не настроен
      if (!sdk._eventsConfigured) {
        sdk.on('rewardClaim', handleRewardClaim);
        sdk._eventsConfigured = true;
      }
    } catch (error) {
      console.error('[GigaOfferWall] Ошибка инициализации SDK для проверки заданий:', error);
      return false;
    }
  }

  const sdk = window.gigaOfferWallSDK;
  if (!sdk) {
    return false;
  }

  // Пробуем разные методы проверки наличия заданий
  try {
    // Метод 1: hasOffers() - если доступен
    if (typeof sdk.hasOffers === 'function') {
      const result = sdk.hasOffers();
      const hasOffers = result instanceof Promise ? await result : result;
      console.log('[GigaOfferWall] Проверка через hasOffers():', hasOffers);
      return Boolean(hasOffers);
    }

    // Метод 2: getOffersCount() - если доступен
    if (typeof sdk.getOffersCount === 'function') {
      const result = sdk.getOffersCount();
      const count = result instanceof Promise ? await result : result;
      console.log('[GigaOfferWall] Проверка через getOffersCount():', count);
      return count > 0;
    }

    // Метод 3: checkAvailability() - если доступен
    if (typeof sdk.checkAvailability === 'function') {
      const isAvailable = await sdk.checkAvailability();
      console.log('[GigaOfferWall] Проверка через checkAvailability():', isAvailable);
      return Boolean(isAvailable);
    }

    // Если нет специальных методов, проверяем наличие SDK
    // В этом случае считаем, что задания могут быть доступны
    // (так как SDK загружен и инициализирован)
    console.log('[GigaOfferWall] Специальные методы проверки недоступны, считаем что задания могут быть доступны');
    return true;
  } catch (error) {
    console.error('[GigaOfferWall] Ошибка при проверке наличия заданий:', error);
    // В случае ошибки считаем, что задания недоступны
    return false;
  }
}

