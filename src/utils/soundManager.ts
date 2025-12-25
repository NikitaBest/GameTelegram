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
  private maxConcurrentSounds: number = 5; // Максимальное количество одновременных звуков
  private failedLoads: Set<SoundType> = new Set(); // Отслеживаем неудачные загрузки

  constructor() {
    // Предзагрузка звуков асинхронно, чтобы не блокировать
    // Используем setTimeout для отложенной загрузки
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.preloadSounds();
      }, 0);
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

    // Ограничиваем количество одновременных звуков
    if (this.activeClones.size >= this.maxConcurrentSounds) {
      // Очищаем завершенные звуки перед добавлением нового
      this.cleanupFinishedSounds();
      if (this.activeClones.size >= this.maxConcurrentSounds) {
        return; // Пропускаем, если все еще слишком много
      }
    }

    const audio = this.sounds.get(type);
    if (!audio) {
      // Не логируем в продакшене, чтобы не засорять консоль
      return;
    }

    try {
      // Всегда клонируем для гарантии независимого воспроизведения
      // Это позволяет воспроизводить один и тот же звук несколько раз одновременно
      const audioToPlay = audio.cloneNode(true) as HTMLAudioElement;
      this.activeClones.add(audioToPlay);
      
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

      // Сбрасываем на начало
      audioToPlay.currentTime = 0;
      
      // Автоматическая очистка после окончания
      audioToPlay.addEventListener('ended', () => {
        this.activeClones.delete(audioToPlay);
        // Удаляем ссылку для сборки мусора
        audioToPlay.src = '';
        audioToPlay.remove();
      }, { once: true });

      // Обработка ошибок загрузки
      audioToPlay.addEventListener('error', () => {
        this.activeClones.delete(audioToPlay);
        audioToPlay.src = '';
        audioToPlay.remove();
      }, { once: true });

      // Воспроизведение с обработкой ошибок
      const playPromise = audioToPlay.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Игнорируем ошибки автовоспроизведения (политики браузера)
          this.activeClones.delete(audioToPlay);
          audioToPlay.src = '';
          audioToPlay.remove();
        });
      }
    } catch (error) {
      // Игнорируем ошибки в продакшене
      console.debug(`[SoundManager] Ошибка воспроизведения звука ${type}`);
    }
  }

  /**
   * Очистка завершенных звуков
   */
  private cleanupFinishedSounds(): void {
    this.activeClones.forEach((clone) => {
      if (clone.ended || clone.paused) {
        this.activeClones.delete(clone);
        clone.src = ''; // Освобождаем память
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

