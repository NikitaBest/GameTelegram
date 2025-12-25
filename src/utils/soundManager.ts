/**
 * Менеджер звуков для игр
 * Максимально простая реализация для стабильности
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
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private lastPlayTime: Map<SoundType, number> = new Map();
  private minInterval: number = 80; // Минимальный интервал между воспроизведениями (80мс)

  constructor() {
    // Загружаем звуки асинхронно после небольшой задержки
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initSounds();
      }, 500); // Задержка 500мс, чтобы не блокировать старт игры
    }
  }

  /**
   * Инициализация звуков (простая загрузка)
   */
  private initSounds(): void {
    Object.entries(SOUNDS).forEach(([type, config]) => {
      try {
        const audio = new Audio(config.path);
        audio.volume = config.volume;
        audio.preload = 'auto';
        
        // Простая обработка ошибок
        audio.addEventListener('error', () => {
          // Просто не добавляем в Map, если ошибка
        }, { once: true });
        
        // Добавляем при готовности
        const addSound = () => {
          this.sounds.set(type as SoundType, audio);
        };
        
        if (audio.readyState >= 2) {
          // Уже загружен
          addSound();
        } else {
          audio.addEventListener('canplaythrough', addSound, { once: true });
          audio.addEventListener('loadeddata', addSound, { once: true });
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    });
  }

  /**
   * Воспроизведение звука - максимально простая версия
   */
  play(type: SoundType): void {
    if (!this.enabled) return;

    const audio = this.sounds.get(type);
    if (!audio) return; // Звук еще не загружен

    // Простой дебаунсинг - ограничиваем частоту
    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(type) || 0;
    if (now - lastPlay < this.minInterval) {
      return;
    }
    this.lastPlayTime.set(type, now);

    try {
      // Просто перезапускаем звук
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Игнорируем ошибки (политики браузера на мобильных)
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
}

// Создаем единственный экземпляр менеджера звуков
export const soundManager = new SoundManager();


