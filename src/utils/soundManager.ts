/**
 * Менеджер звуков для игр
 * Оптимизирован для Telegram Web App и устранения подвисаний
 */

import { isTelegramWebApp } from '../lib/telegram';

export type SoundType = 'jump' | 'hit' | 'score' | 'start' | 'gameOver';

interface SoundConfig {
  path: string;
  volume: number;
}

// Конфигурация звуков
const SOUNDS: Record<SoundType, SoundConfig> = {
  jump: {
    path: '/sounds/jump.mp3',
    volume: 0.5,
  },
  hit: {
    path: '/sounds/hit.mp3',
    volume: 0.6,
  },
  score: {
    path: '/sounds/score.mp3',
    volume: 0.4,
  },
  start: {
    path: '/sounds/jump.mp3',
    volume: 0.5,
  },
  gameOver: {
    path: '/sounds/hit.mp3',
    volume: 0.5,
  },
};

class SoundManager {
  // Пул аудио элементов для каждого типа звука (вместо клонирования)
  private audioPools: Map<SoundType, HTMLAudioElement[]> = new Map();
  private poolSize: number = 3; // Размер пула для каждого типа звука
  private enabled: boolean = true;
  private lastPlayTime: Map<SoundType, number> = new Map();
  private minInterval: number = 80; // Минимальный интервал между воспроизведениями (80мс)
  private audioContextUnlocked: boolean = false; // Флаг разблокировки аудиоконтекста
  private initStarted: boolean = false; // Флаг начала инициализации
  private systemSoundEnabled: boolean = true; // Флаг системного уровня звука
  private isTelegram: boolean = false; // Флаг работы в Telegram Web App
  private lastSystemSoundCheck: number = 0; // Время последней проверки системного звука
  private systemSoundCheckInterval: number = 2000; // Интервал проверки системного звука (2 секунды)
  private systemSoundFailCount: number = 0; // Счетчик неудачных попыток воспроизведения
  private systemSoundFailThreshold: number = 3; // Порог для отключения звука (3 неудачные попытки)

  constructor() {
    // Проверяем, работаем ли в Telegram Web App
    this.isTelegram = isTelegramWebApp();
    
    // Не загружаем звуки сразу, ждем первого взаимодействия пользователя
    if (typeof window !== 'undefined') {
      // Добавляем обработчики для разблокировки аудиоконтекста
      this.setupAudioUnlock();
      // Проверяем системный уровень звука
      this.checkSystemSound();
    }
  }

  /**
   * Настройка разблокировки аудиоконтекста при первом взаимодействии
   * Критично для мобильных устройств
   */
  private setupAudioUnlock(): void {
    const unlockAudio = () => {
      if (this.audioContextUnlocked) return;
      
      this.audioContextUnlocked = true;
      
      // Создаем и сразу останавливаем пустой аудио элемент для разблокировки
      try {
        const dummyAudio = new Audio();
        dummyAudio.volume = 0;
        const playPromise = dummyAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              dummyAudio.pause();
              dummyAudio.currentTime = 0;
            })
            .catch(() => {
              // Игнорируем ошибки
            });
        }
      } catch (error) {
        // Игнорируем ошибки
      }

      // Инициализируем звуки после разблокировки
      if (!this.initStarted) {
        this.initStarted = true;
        this.initSounds();
      }
    };

    // Разблокируем при различных событиях взаимодействия
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true, passive: true });
    });
  }

  /**
   * Проверка системного уровня звука на мобильных устройствах
   * В Telegram Web App проверка работает по-другому из-за WebView
   */
  private checkSystemSound(): void {
    // Устанавливаем начальное значение в true (предполагаем, что звук включен)
    this.systemSoundEnabled = true;
    
    // В Telegram Web App проверяем более агрессивно
    if (this.isTelegram) {
      // Проверяем при изменении видимости страницы
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Страница стала видимой - сбрасываем флаг для повторной проверки
          this.systemSoundEnabled = true;
          this.lastSystemSoundCheck = 0; // Сбрасываем таймер проверки
          this.systemSoundFailCount = 0; // Сбрасываем счетчик неудач
        }
      }, { passive: true });
    } else {
      // В обычном браузере проверяем реже
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.systemSoundEnabled = true;
        }
      }, { passive: true });
    }
  }

  /**
   * Проверка системного уровня звука через реальное воспроизведение
   * В Telegram WebView это более надежный способ
   */
  private verifySystemSoundWithPlay(audio: HTMLAudioElement): void {
    const now = Date.now();
    
    // Проверяем не чаще чем раз в интервал
    if (now - this.lastSystemSoundCheck < this.systemSoundCheckInterval) {
      return;
    }
    
    this.lastSystemSoundCheck = now;
    
    // Проверяем через задержку, действительно ли звук воспроизводится
    setTimeout(() => {
      if (!audio) return;
      
      // В WebView звук может быть "воспроизведен", но не слышен
      // Проверяем несколько условий
      const isActuallyPlaying = !audio.paused && audio.currentTime > 0;
      const wasPlayingButStopped = audio.ended || (audio.paused && audio.currentTime > 0.1);
      
      if (isActuallyPlaying || wasPlayingButStopped) {
        // Звук воспроизводится - системный уровень звука включен
        this.systemSoundEnabled = true;
        this.systemSoundFailCount = 0; // Сбрасываем счетчик неудач
      } else {
        // Звук не воспроизводится - возможно, устройство в беззвучном режиме
        // В Telegram Web App увеличиваем счетчик неудач
        if (this.isTelegram) {
          this.systemSoundFailCount++;
          
          // Если несколько попыток подряд неудачны - отключаем звук
          if (this.systemSoundFailCount >= this.systemSoundFailThreshold) {
            this.systemSoundEnabled = false;
            console.log('[SoundManager] Системный звук отключен - устройство в беззвучном режиме');
          }
        } else {
          // В обычном браузере отключаем сразу после первой неудачи
          // (в обычном браузере проверка более надежна)
          this.systemSoundEnabled = false;
        }
      }
    }, this.isTelegram ? 200 : 100); // Больше задержка для WebView
  }

  /**
   * Инициализация звуков (создание пула аудио элементов)
   */
  private initSounds(): void {
    Object.entries(SOUNDS).forEach(([type, config]) => {
      const pool: HTMLAudioElement[] = [];
      
      // Создаем пул из нескольких аудио элементов для каждого типа звука
      for (let i = 0; i < this.poolSize; i++) {
        try {
          const audio = new Audio(config.path);
          audio.volume = config.volume;
          audio.preload = 'auto';
          
          // Обработка ошибок
          audio.addEventListener('error', () => {
            console.warn(`[SoundManager] Ошибка загрузки звука: ${type}`);
          }, { once: true });
          
          // Добавляем в пул при готовности
          const addToPool = () => {
            pool.push(audio);
            if (pool.length === this.poolSize) {
              this.audioPools.set(type as SoundType, pool);
            }
          };
          
          if (audio.readyState >= 2) {
            // Уже загружен
            addToPool();
          } else {
            audio.addEventListener('canplaythrough', addToPool, { once: true });
            audio.addEventListener('loadeddata', addToPool, { once: true });
          }
        } catch (error) {
          console.warn(`[SoundManager] Ошибка создания звука: ${type}`, error);
        }
      }
    });
  }

  /**
   * Воспроизведение звука с использованием пула аудио элементов
   * Оптимизировано для устранения подвисаний и проверки системного уровня звука
   */
  play(type: SoundType): void {
    // Проверяем все условия для воспроизведения
    if (!this.enabled || !this.systemSoundEnabled) return;

    // Если аудиоконтекст еще не разблокирован, пытаемся разблокировать
    if (!this.audioContextUnlocked) {
      this.setupAudioUnlock();
      // Если звуки еще не инициализированы, инициализируем их
      if (!this.initStarted) {
        this.initStarted = true;
        this.initSounds();
      }
    }

    const pool = this.audioPools.get(type);
    if (!pool || pool.length === 0) {
      // Звук еще не загружен, пытаемся инициализировать если еще не начали
      if (!this.initStarted) {
        this.initStarted = true;
        this.initSounds();
      }
      return;
    }

    // Дебаунсинг - ограничиваем частоту
    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(type) || 0;
    if (now - lastPlay < this.minInterval) {
      return;
    }
    this.lastPlayTime.set(type, now);

    // Находим свободный аудио элемент из пула
    // Ищем элемент, который не воспроизводится в данный момент
    let audioToPlay: HTMLAudioElement | null = null;
    
    for (const audio of pool) {
      if (audio.paused || audio.ended || audio.currentTime === 0) {
        audioToPlay = audio;
        break;
      }
    }
    
    // Если все элементы заняты, используем первый (перезапускаем)
    if (!audioToPlay) {
      audioToPlay = pool[0];
    }

    // В Telegram Web App не используем requestAnimationFrame - он может вызывать подвисания
    // Вместо этого используем прямой асинхронный вызов через Promise
    const playSound = () => {
      try {
        if (!audioToPlay) return;
        
        // Сбрасываем позицию и воспроизводим
        audioToPlay.currentTime = 0;
        const playPromise = audioToPlay.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Проверяем системный уровень звука
              this.verifySystemSoundWithPlay(audioToPlay!);
            })
            .catch(() => {
              // Игнорируем ошибки автоплея (политики браузера)
              // На мобильных устройствах это нормально, если пользователь еще не взаимодействовал
            });
        } else {
          // Если play() не вернул Promise, проверяем сразу
          this.verifySystemSoundWithPlay(audioToPlay);
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    };

    // В Telegram Web App используем прямой вызов, в обычном браузере - через микротаск
    if (this.isTelegram) {
      // Прямой вызов для WebView - более надежно
      playSound();
    } else {
      // В обычном браузере используем микротаск для неблокирующего выполнения
      Promise.resolve().then(playSound);
    }
  }

  /**
   * Включить/выключить звуки
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Проверка, включены ли звуки
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Принудительная разблокировка аудиоконтекста (можно вызвать вручную)
   */
  unlockAudioContext(): void {
    if (!this.audioContextUnlocked) {
      this.setupAudioUnlock();
    }
    if (!this.initStarted) {
      this.initStarted = true;
      this.initSounds();
    }
  }
}

// Создаем единственный экземпляр менеджера звуков
export const soundManager = new SoundManager();


