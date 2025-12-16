export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const SHIP_WIDTH = 80;
export const SHIP_HEIGHT = 80;

export type GameObjectType =
  | 'star'
  | 'crystal'
  | 'bonus'
  | 'asteroid'
  | 'enemy'
  | 'blackhole';

export interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: GameObjectType;
}

export type GameEffectType = 'score' | 'damage';

export interface GameEffect {
  id: number;
  x: number;
  y: number;
  type: GameEffectType;
  text?: string;
}

export interface GameState {
  score: number;
  multiplier: number;
  level: number;
  lives: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  showRules: boolean;
}


