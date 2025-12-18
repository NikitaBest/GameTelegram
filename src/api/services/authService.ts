import { TelegramUserData, getTelegramUserData, getMockTelegramUserData } from '../../lib/telegram';

// @ts-expect-error - Vite добавляет env в import.meta
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://telegram-games.tg-projects.ru';

export interface AuthResponse {
  user: {
    telegramId: number;
    isBot: boolean | null;
    role: number;
    status: number;
    isPremium: boolean;
    addedToAttachmentMenu: boolean;
    allowsWriteToPm: boolean;
    userName: string | null;
    firstName: string;
    lastName: string | null;
    phoneNumber: string | null;
    photoUrl: string | null;
    languageCode: string;
    isBlocked: boolean | null;
    starsAmount: number;
    userPhoto: {
      userId: number;
      photoData: string;
      id: number;
      createdAt: string;
    } | null;
    subscribedToChannel: boolean;
    channelSubscriptionBoosted: boolean;
    id: number;
    createdAt: string;
  };
  token: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

/**
 * Авторизация пользователя через Telegram Web App
 * Приоритет: если доступны реальные данные из Telegram - используем их, иначе мок-данные для разработки
 */
export async function login(): Promise<AuthResponse> {
  let userData: TelegramUserData | null = null;

  // Всегда пытаемся получить реальные данные из Telegram, если они доступны
  const telegramData = getTelegramUserData();
  
  if (telegramData) {
    // Используем реальные данные из Telegram Web App
    userData = telegramData;
    console.log('Используются реальные данные из Telegram Web App');
  } else {
    // Если Telegram Web App недоступен
    // В DEV используем мок-данные, в PROD кидаем ошибку
    // @ts-expect-error - Vite добавляет env в import.meta
    if (import.meta.env.DEV) {
      userData = getMockTelegramUserData();
      console.warn('Telegram Web App недоступен, используются мок-данные для разработки');
    } else {
      throw new Error('Telegram Web App недоступен. Откройте игру через Telegram.');
    }
  }

  if (!userData) {
    throw new Error('Не удалось получить данные пользователя');
  }
  
  // Подготавливаем данные для отправки в формате, который ожидает бекенд
  // Заменяем null на пустые строки для строковых полей, чтобы соответствовать Swagger
  const requestData = {
    userTelegramId: userData.userTelegramId,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    userName: userData.userName || '',
    photoUrl: userData.photoUrl || '',
    initData: userData.initData || '',
    languageCode: userData.languageCode || 'ru',
    isPremium: userData.isPremium,
    addedToAttachmentMenu: userData.addedToAttachmentMenu,
    allowsWriteToPm: userData.allowsWriteToPm,
    ignoreValidate: userData.ignoreValidate,
    // utm - опциональное поле, отправляем только если есть параметр tgWebAppStartParam
    // Если параметр есть, отправляем его ПОЛНОЕ значение (например, "33_utm-channel")
    ...(userData.utm ? { utm: userData.utm } : {}),
  };
  
  // Логируем для отладки
  // @ts-expect-error - Vite добавляет env в import.meta
  if (import.meta.env.DEV) {
    console.log('Параметр utm для запроса login:', {
      hasUtm: Boolean(userData.utm),
      utmValue: userData.utm || '(не отправляется)',
      source: userData.utm ? 'из tgWebAppStartParam' : 'параметр отсутствует',
    });
  }
  
  // Логируем отправляемые данные для отладки (только в режиме разработки)
  // @ts-expect-error - Vite добавляет env в import.meta
  if (import.meta.env.DEV) {
    const jsonBody = JSON.stringify(requestData);
    console.log('Отправляемые данные авторизации:', {
      ...requestData,
      initData: requestData.initData ? `${requestData.initData.substring(0, 100)}...` : 'отсутствует',
      initDataLength: requestData.initData?.length || 0,
      hasHash: requestData.initData?.includes('hash=') || false,
      ignoreValidate: requestData.ignoreValidate,
      jsonBodyLength: jsonBody.length,
      fullJsonBody: jsonBody, // Полный JSON для проверки
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    // Проверяем Content-Length для определения, есть ли тело ответа
    const contentLength = response.headers.get('content-length');
    const hasBody = contentLength && parseInt(contentLength, 10) > 0;

    // Получаем текст ответа для анализа
    const responseText = await response.text();
    
    // Логируем информацию о ответе для отладки
    // @ts-expect-error - Vite добавляет env в import.meta
    if (import.meta.env.DEV) {
      console.log('Ответ от бекенда:', {
        status: response.status,
        statusText: response.statusText,
        contentLength: contentLength,
        hasBody: hasBody,
        responseText: responseText || '(пусто)',
        headers: Object.fromEntries(response.headers.entries()),
      });
    }

    if (!response.ok) {
      let errorData: any = {};
      
      // Пытаемся распарсить JSON только если есть тело ответа
      if (responseText && responseText.trim().length > 0) {
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.warn('Не удалось распарсить ошибку как JSON:', parseError);
          errorData = { message: responseText || `Ошибка ${response.status}` };
        }
      }
      
      // Детальное логирование ошибки для отладки
      console.error('Ошибка авторизации:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        responseText: responseText,
        sentData: {
          ...requestData,
          initData: requestData.initData ? `${requestData.initData.substring(0, 50)}...` : 'отсутствует',
        },
      });
      
      const error: AuthError = {
        message: errorData.error || errorData.message || responseText || `Ошибка авторизации: ${response.status}`,
        status: response.status,
      };
      throw error;
    }

    // Проверяем, что ответ не пустой
    if (!responseText || responseText.trim().length === 0) {
      const error: AuthError = {
        message: 'Бекенд вернул пустой ответ. Возможно, проблема с валидацией данных.',
        status: response.status,
      };
      console.error('Пустой ответ от бекенда при успешном статусе:', {
        status: response.status,
        sentData: {
          ...requestData,
          initData: requestData.initData ? `${requestData.initData.substring(0, 100)}...` : 'отсутствует',
        },
        fullRequestData: requestData, // Полные данные для отладки
      });
      throw error;
    }

    // Пытаемся распарсить JSON
    let data: AuthResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      const error: AuthError = {
        message: `Не удалось распарсить ответ от бекенда: ${parseError instanceof Error ? parseError.message : 'Неизвестная ошибка'}`,
        status: response.status,
      };
      console.error('Ошибка парсинга ответа:', {
        parseError,
        responseText,
        status: response.status,
      });
      throw error;
    }

    // Проверяем, что в ответе есть необходимые поля
    if (!data.token) {
      const error: AuthError = {
        message: 'Ответ от бекенда не содержит токен авторизации',
        status: response.status,
      };
      console.error('Отсутствует токен в ответе:', data);
      throw error;
    }

    return data;
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error && 'status' in error) {
      throw error as AuthError;
    }
    throw {
      message: error instanceof Error ? error.message : 'Неизвестная ошибка при авторизации',
    } as AuthError;
  }
}

