/**
 * Менеджер звуков для игр
 * Оптимизирован для устранения подвисаний и поддержки системного уровня звука
 */

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

  constructor() {
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
   * На мобильных устройствах, если звук выключен на системном уровне,
   * звук не будет воспроизводиться даже при успешном вызове play()
   */
  private checkSystemSound(): void {
    // Устанавливаем начальное значение в true (предполагаем, что звук включен)
    this.systemSoundEnabled = true;
    
    // Проверяем при изменении видимости страницы (когда пользователь возвращается)
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Страница стала видимой - сбрасываем флаг для повторной проверки
          this.systemSoundEnabled = true;
        }
      }, { passive: true });
    }
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

    // Воспроизводим звук асинхронно, не блокируя основной поток
    // Используем requestAnimationFrame для неблокирующего воспроизведения
    requestAnimationFrame(() => {
      try {
        if (!audioToPlay) return;
        
        // Сбрасываем позицию и воспроизводим
        audioToPlay.currentTime = 0;
        const playPromise = audioToPlay.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Проверяем, действительно ли звук воспроизводится
              // На мобильных устройствах, если звук выключен на системном уровне,
              // play() может успешно выполниться, но звук не будет воспроизводиться
              setTimeout(() => {
                if (audioToPlay) {
                  // Если звук должен воспроизводиться, но он на паузе и не продвинулся,
                  // значит устройство в беззвучном режиме
                  if (audioToPlay.paused && audioToPlay.currentTime === 0) {
                    // Звук не воспроизводится - устройство в беззвучном режиме
                    this.systemSoundEnabled = false;
                  } else if (!audioToPlay.paused || audioToPlay.currentTime > 0) {
                    // Звук воспроизводится - системный уровень звука включен
                    this.systemSoundEnabled = true;
                  }
                }
              }, 100);
            })
            .catch(() => {
              // Игнорируем ошибки автоплея (политики браузера)
              // На мобильных устройствах это нормально, если пользователь еще не взаимодействовал
            });
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    });
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


