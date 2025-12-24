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
    path: '/sounds/start.mp3',
    volume: 0.5,
  },
  gameOver: {
    path: '/sounds/gameOver.mp3',
    volume: 0.5,
  },
};

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private masterVolume: number = 1.0;

  constructor() {
    // Предзагрузка звуков
    this.preloadSounds();
  }

  /**
   * Предзагрузка всех звуков
   */
  private preloadSounds(): void {
    Object.entries(SOUNDS).forEach(([type, config]) => {
      const audio = new Audio(config.path);
      audio.volume = config.volume * this.masterVolume;
      audio.preload = 'auto';
      // Обработка ошибок загрузки
      audio.addEventListener('error', () => {
        console.warn(`[SoundManager] Не удалось загрузить звук: ${type}`);
      });
      this.sounds.set(type as SoundType, audio);
    });
  }

  /**
   * Воспроизведение звука
   */
  play(type: SoundType, options?: { volume?: number; loop?: boolean }): void {
    if (!this.enabled) return;

    const audio = this.sounds.get(type);
    if (!audio) {
      console.warn(`[SoundManager] Звук не найден: ${type}`);
      return;
    }

    try {
      // Клонируем аудио для возможности одновременного воспроизведения
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      
      if (options?.volume !== undefined) {
        audioClone.volume = options.volume * this.masterVolume;
      } else {
        audioClone.volume = SOUNDS[type].volume * this.masterVolume;
      }

      if (options?.loop) {
        audioClone.loop = true;
      }

      // Воспроизведение с обработкой ошибок
      const playPromise = audioClone.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Игнорируем ошибки автовоспроизведения (политики браузера)
          console.debug(`[SoundManager] Не удалось воспроизвести звук ${type}:`, error);
        });
      }
    } catch (error) {
      console.warn(`[SoundManager] Ошибка воспроизведения звука ${type}:`, error);
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
      audio.pause();
      audio.currentTime = 0;
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

