/**
 * Менеджер звуков для игр
 * Исправлена поддержка мобильных устройств и устранены подвисания на десктопе
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
  private soundTemplates: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private lastPlayTime: Map<SoundType, number> = new Map();
  private minInterval: number = 80; // Минимальный интервал между воспроизведениями (80мс)
  private audioContextUnlocked: boolean = false; // Флаг разблокировки аудиоконтекста
  private initStarted: boolean = false; // Флаг начала инициализации

  constructor() {
    // Не загружаем звуки сразу, ждем первого взаимодействия пользователя
    if (typeof window !== 'undefined') {
      // Добавляем обработчики для разблокировки аудиоконтекста
      this.setupAudioUnlock();
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
   * Инициализация звуков (загрузка шаблонов)
   */
  private initSounds(): void {
    Object.entries(SOUNDS).forEach(([type, config]) => {
      try {
        const audio = new Audio(config.path);
        audio.volume = config.volume;
        audio.preload = 'auto';
        
        // Обработка ошибок
        audio.addEventListener('error', () => {
          console.warn(`[SoundManager] Ошибка загрузки звука: ${type}`);
        }, { once: true });
        
        // Добавляем шаблон при готовности
        const addSound = () => {
          this.soundTemplates.set(type as SoundType, audio);
        };
        
        if (audio.readyState >= 2) {
          // Уже загружен
          addSound();
        } else {
          audio.addEventListener('canplaythrough', addSound, { once: true });
          audio.addEventListener('loadeddata', addSound, { once: true });
        }
      } catch (error) {
        console.warn(`[SoundManager] Ошибка создания звука: ${type}`, error);
      }
    });
  }

  /**
   * Воспроизведение звука с использованием клонирования для устранения подвисаний
   */
  play(type: SoundType): void {
    if (!this.enabled) return;

    // Если аудиоконтекст еще не разблокирован, пытаемся разблокировать
    if (!this.audioContextUnlocked) {
      this.setupAudioUnlock();
      // Если звуки еще не инициализированы, инициализируем их
      if (!this.initStarted) {
        this.initStarted = true;
        this.initSounds();
      }
    }

    const template = this.soundTemplates.get(type);
    if (!template) {
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

    try {
      // Клонируем аудио элемент для одновременного воспроизведения
      // Это устраняет подвисания при быстром повторном воспроизведении
      const audioClone = template.cloneNode(false) as HTMLAudioElement;
      audioClone.volume = template.volume;
      
      // Обработка ошибок для клона
      audioClone.addEventListener('error', () => {
        // Игнорируем ошибки
      }, { once: true });
      
      // Удаляем клон после окончания воспроизведения
      audioClone.addEventListener('ended', () => {
        audioClone.remove();
      }, { once: true });

      // Воспроизводим клон асинхронно, не блокируя основной поток
      const playPromise = audioClone.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Игнорируем ошибки автоплея (политики браузера)
          // На мобильных устройствах это нормально, если пользователь еще не взаимодействовал
        });
      }
    } catch (error) {
      // Игнорируем ошибки
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


