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
  private activeClones: Set<HTMLAudioElement> = new Set(); // Отслеживаем активные клоны
  private maxConcurrentSounds: number = 3; // Уменьшено для производительности
  private failedLoads: Set<SoundType> = new Set(); // Отслеживаем неудачные загрузки
  private lastCleanupTime: number = 0; // Время последней очистки
  private cleanupInterval: number = 500; // Очистка не чаще раза в 500мс

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

    // Периодическая очистка (не чаще раза в cleanupInterval)
    const now = Date.now();
    if (now - this.lastCleanupTime > this.cleanupInterval) {
      this.cleanupFinishedSounds();
      this.lastCleanupTime = now;
    }

    // Ограничиваем количество одновременных звуков
    if (this.activeClones.size >= this.maxConcurrentSounds) {
      return; // Пропускаем, если слишком много звуков
    }

    try {
      // Используем оригинальный элемент, если он не играет (быстрее чем клонирование)
      let audioToPlay: HTMLAudioElement;
      const isOriginalPlaying = !audio.paused && !audio.ended && audio.currentTime > 0;
      
      if (isOriginalPlaying) {
        // Клонируем только если оригинал уже играет
        audioToPlay = audio.cloneNode(false) as HTMLAudioElement; // false = не глубокое клонирование (быстрее)
        this.activeClones.add(audioToPlay);
      } else {
        // Используем оригинальный элемент
        audioToPlay = audio;
        audioToPlay.currentTime = 0;
      }
      
      // Настройка громкости
      if (options?.volume !== undefined) {
        audioToPlay.volume = options.volume * this.masterVolume;
      } else {
        audioToPlay.volume = SOUNDS[type].volume * this.masterVolume;
      }

      // Настройка зацикливания
      if (options?.loop) {
        audioToPlay.loop = true;
      }

      // Сбрасываем на начало только если это клон
      if (isOriginalPlaying) {
        audioToPlay.currentTime = 0;
        
        // Автоматическая очистка после окончания (только для клонов)
        const cleanup = () => {
          this.activeClones.delete(audioToPlay);
          // Не вызываем remove() - это дорогая DOM операция
          audioToPlay.src = '';
        };
        
        audioToPlay.addEventListener('ended', cleanup, { once: true });
        audioToPlay.addEventListener('error', cleanup, { once: true });
      }

      // Воспроизведение с обработкой ошибок
      const playPromise = audioToPlay.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Игнорируем ошибки автовоспроизведения
          if (isOriginalPlaying) {
            this.activeClones.delete(audioToPlay);
            audioToPlay.src = '';
          }
        });
      }
    } catch (error) {
      // Игнорируем ошибки в продакшене
    }
  }

  /**
   * Очистка завершенных звуков
   */
  private cleanupFinishedSounds(): void {
    // Используем итератор для безопасного удаления
    const toRemove: HTMLAudioElement[] = [];
    this.activeClones.forEach((clone) => {
      // Проверяем состояние без обращения к DOM свойствам если возможно
      try {
        if (clone.ended || (clone.paused && clone.currentTime === 0)) {
          toRemove.push(clone);
        }
      } catch (e) {
        // Если элемент уже удален из DOM, добавляем в список на удаление
        toRemove.push(clone);
      }
    });
    
    // Удаляем завершенные звуки
    toRemove.forEach((clone) => {
      this.activeClones.delete(clone);
      try {
        clone.src = '';
      } catch (e) {
        // Игнорируем ошибки при очистке
      }
    });
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
      audio.pause();
      audio.currentTime = 0;
    });
    
    // Останавливаем и очищаем все клоны
    this.activeClones.forEach((clone) => {
      clone.pause();
      clone.currentTime = 0;
      clone.src = '';
    });
    this.activeClones.clear();
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

