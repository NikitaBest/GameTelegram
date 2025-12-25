/**
 * Менеджер звуков для игр
 * Использует Web Audio API
 * Простая логика: если звук включен на устройстве - есть звук в игре, если выключен - нет звука
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
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<SoundType, AudioBuffer> = new Map();
  private enabled: boolean = true;
  private lastPlayTime: Map<SoundType, number> = new Map();
  private minInterval: number = 80; // Минимальный интервал между воспроизведениями (80мс)
  private audioContextUnlocked: boolean = false;
  private initStarted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupAudioUnlock();
    }
  }

  /**
   * Создание или получение AudioContext
   */
  private getAudioContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          return null;
        }
        
        this.audioContext = new AudioContextClass();
      } catch (error) {
        return null;
      }
    }
    
    return this.audioContext;
  }

  /**
   * Разблокировка аудиоконтекста при первом взаимодействии
   */
  private setupAudioUnlock(): void {
    const unlockAudio = async () => {
      if (this.audioContextUnlocked) return;
      
      this.audioContextUnlocked = true;
      const context = this.getAudioContext();
      if (!context) return;
      
      try {
        if (context.state === 'suspended') {
          await context.resume();
        }
      } catch (error) {
        // Игнорируем ошибки
      }

      if (!this.initStarted) {
        this.initStarted = true;
        this.initSounds();
      }
    };

    const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true, passive: true });
    });
  }

  /**
   * Загрузка звукового файла и декодирование в AudioBuffer
   */
  private async loadSound(config: SoundConfig): Promise<AudioBuffer | null> {
    const context = this.getAudioContext();
    if (!context) return null;
    
    try {
      const response = await fetch(config.path);
      if (!response.ok) return null;
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      
      return audioBuffer;
    } catch (error) {
      return null;
    }
  }

  /**
   * Инициализация звуков (загрузка и декодирование)
   */
  private async initSounds(): Promise<void> {
    const context = this.getAudioContext();
    if (!context) return;
    
    const loadPromises = Object.entries(SOUNDS).map(async ([soundType, config]) => {
      const buffer = await this.loadSound(config);
      if (buffer) {
        this.audioBuffers.set(soundType as SoundType, buffer);
      }
    });
    
    await Promise.all(loadPromises);
  }

  /**
   * Воспроизведение звука
   * Простая логика: если AudioContext в состоянии 'running' - воспроизводим, если 'suspended' - не воспроизводим
   */
  play(type: SoundType): void {
    if (!this.enabled) return;

    if (!this.audioContextUnlocked) {
      this.setupAudioUnlock();
      if (!this.initStarted) {
        this.initStarted = true;
        this.initSounds();
      }
    }

    const context = this.getAudioContext();
    if (!context) return;

    // Простая проверка: если контекст приостановлен - звук выключен на устройстве
    if (context.state === 'suspended') {
      // Пытаемся восстановить (на случай, если пользователь включил звук)
      context.resume().catch(() => {});
      return;
    }

    // Если контекст не в состоянии 'running', не воспроизводим
    if (context.state !== 'running') {
      return;
    }

    const buffer = this.audioBuffers.get(type);
    if (!buffer) {
      if (!this.initStarted) {
        this.initStarted = true;
        this.initSounds();
      }
      return;
    }

    // Дебаунсинг
    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(type) || 0;
    if (now - lastPlay < this.minInterval) {
      return;
    }
    this.lastPlayTime.set(type, now);

    // Воспроизводим звук
    try {
      const source = context.createBufferSource();
      source.buffer = buffer;

      const gainNode = context.createGain();
      gainNode.gain.value = SOUNDS[type].volume;

      source.connect(gainNode);
      gainNode.connect(context.destination);

      source.start(0);
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
   * Принудительная разблокировка аудиоконтекста
   */
  async unlockAudioContext(): Promise<void> {
    if (!this.audioContextUnlocked) {
      this.setupAudioUnlock();
    }
    
    const context = this.getAudioContext();
    if (context && context.state === 'suspended') {
      try {
        await context.resume();
      } catch (error) {
        // Игнорируем ошибки
      }
    }
    
    if (!this.initStarted) {
      this.initStarted = true;
      await this.initSounds();
    }
  }
}

// Создаем единственный экземпляр менеджера звуков
export const soundManager = new SoundManager();
