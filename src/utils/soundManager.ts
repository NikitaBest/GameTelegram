/**
 * Менеджер звуков для игр
 * Управляет воспроизведением звуковых эффектов
 */

export type SoundType = 'jump' | 'hit' | 'score' | 'start' | 'gameOver';

interface SoundConfig {
  path: string;
  volume: number; // 0.0 - 1.0
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
    path: '/sounds/jump.mp3', // Используем jump как start, если файла нет
    volume: 0.5,
  },
  gameOver: {
    path: '/sounds/hit.mp3', // Используем hit как gameOver, если файла нет
    volume: 0.5,
  },
};

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private masterVolume: number = 1.0;
  private failedLoads: Set<SoundType> = new Set(); // Отслеживаем неудачные загрузки
  private lastPlayTime: Map<SoundType, number> = new Map(); // Время последнего воспроизведения
  private minPlayInterval: number = 50; // Минимальный интервал между воспроизведениями одного звука (50мс)

  constructor() {
    // Предзагрузка звуков асинхронно, чтобы не блокировать
    // Используем requestIdleCallback если доступен, иначе setTimeout
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          this.preloadSounds();
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          this.preloadSounds();
        }, 100);
      }
    }
  }

  /**
   * Предзагрузка всех звуков
   */
  private preloadSounds(): void {
    Object.entries(SOUNDS).forEach(([type, config]) => {
      try {
        const audio = new Audio(config.path);
        audio.volume = config.volume * this.masterVolume;
        audio.preload = 'auto';
        
        // Обработка ошибок загрузки - не блокируем выполнение
        audio.addEventListener('error', () => {
          this.failedLoads.add(type as SoundType);
          // Если все звуки не загрузились, отключаем звуки автоматически
          if (this.failedLoads.size === Object.keys(SOUNDS).length) {
            this.enabled = false;
          }
        }, { once: true });
        
        // Добавляем только при успешной загрузке
        audio.addEventListener('canplaythrough', () => {
          this.sounds.set(type as SoundType, audio);
        }, { once: true });
        
        // Таймаут для случаев, когда событие не сработает
        // Если через 2 секунды звук не загрузился, считаем его недоступным
        setTimeout(() => {
          if (!this.sounds.has(type as SoundType) && !this.failedLoads.has(type as SoundType)) {
            // Пробуем проверить готовность
            if (audio.readyState >= 2) { // HAVE_CURRENT_DATA или выше
              this.sounds.set(type as SoundType, audio);
            } else {
              this.failedLoads.add(type as SoundType);
            }
          }
        }, 2000);
      } catch (error) {
        // Игнорируем ошибки создания Audio элемента
        this.failedLoads.add(type as SoundType);
      }
    });
  }

  /**
   * Воспроизведение звука
   * Упрощенная версия без клонирования для максимальной производительности
   */
  play(type: SoundType, options?: { volume?: number; loop?: boolean }): void {
    if (!this.enabled) return;
    
    // Если звук не загрузился, не пытаемся воспроизвести
    if (this.failedLoads.has(type)) {
      return;
    }

    const audio = this.sounds.get(type);
    if (!audio) {
      return;
    }

    // Дебаунсинг - ограничиваем частоту воспроизведения одного звука
    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(type) || 0;
    if (now - lastPlay < this.minPlayInterval) {
      return; // Пропускаем, если звук воспроизводился недавно
    }
    this.lastPlayTime.set(type, now);

    try {
      // Используем только оригинальный элемент - максимально просто и быстро
      // Если звук уже играет, просто перезапускаем его
      if (!audio.paused && audio.currentTime > 0) {
        // Если звук играет, останавливаем и перезапускаем
        audio.pause();
        audio.currentTime = 0;
      }

      // Настройка громкости
      if (options?.volume !== undefined) {
        audio.volume = options.volume * this.masterVolume;
      } else {
        audio.volume = SOUNDS[type].volume * this.masterVolume;
      }

      // Настройка зацикливания
      if (options?.loop) {
        audio.loop = true;
      } else {
        audio.loop = false;
      }

      // Сбрасываем на начало
      audio.currentTime = 0;

      // Воспроизведение с обработкой ошибок (асинхронно, не блокируем)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Игнорируем ошибки автовоспроизведения (политики браузера)
        });
      }
    } catch (error) {
      // Игнорируем все ошибки в продакшене
    }
  }


  /**
   * Остановка звука
   */
  stop(type: SoundType): void {
    const audio = this.sounds.get(type);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Остановка всех звуков
   */
  stopAll(): void {
    this.sounds.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        // Игнорируем ошибки
      }
    });
  }

  /**
   * Включить/выключить звуки
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Проверка, включены ли звуки
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Установка общей громкости (0.0 - 1.0)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    // Обновляем громкость всех звуков
    this.sounds.forEach((audio, type) => {
      audio.volume = SOUNDS[type].volume * this.masterVolume;
    });
  }

  /**
   * Получить текущую громкость
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }
}

// Создаем единственный экземпляр менеджера звуков
export const soundManager = new SoundManager();


