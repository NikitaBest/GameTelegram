import { GameContainer as CosmosGame } from './game cosmos/GameContainer';
import { FlappyBirdGame } from './flappy-bird/FlappyBirdGame';
import { BallAndWallGame } from './ball and wall/MyNewGame';

interface GameRouterProps {
  gameId: number | null;
  onGameOver: (score: number) => void;
}

/**
 * Роутер для выбора игры на основе gameId из бекенда
 * 
 * Игры:
 * - gameId: 11 - Космическая игра (game cosmos)
 * - gameId: 12 - Ball and Wall (ball and wall, игра по умолчанию)
 * - gameId: 13 - Flappy Bird
 * 
 * Для добавления новой игры:
 * 1. Создайте папку с игрой в src/game/
 * 2. Добавьте case в switch ниже
 * 3. Убедитесь, что игра принимает onGameOver(score: number)
 */
export function GameRouter({ gameId, onGameOver }: GameRouterProps) {
  // Если gameId не указан, используем Ball and Wall по умолчанию
  const selectedGameId = gameId || 12;

  // Отладка
  console.log('[GameRouter] Выбор игры:', {
    gameId,
    selectedGameId,
    willUseGame: selectedGameId === 11 ? 'Cosmos' : selectedGameId === 12 ? 'Ball and Wall' : selectedGameId === 13 ? 'Flappy Bird' : 'Unknown'
  });

  switch (selectedGameId) {
    case 11:
      // Космическая игра
      return <CosmosGame onGameOver={onGameOver} />;
    
    case 12:
      // Ball and Wall (игра по умолчанию)
      return <BallAndWallGame onGameOver={onGameOver} />;
    
    case 13:
      // Flappy Bird
      return <FlappyBirdGame onGameOver={onGameOver} />;
    
    default:
      // Fallback на Ball and Wall
      console.warn(`Неизвестный gameId: ${gameId}, используем игру по умолчанию (Ball and Wall)`);
      return <BallAndWallGame onGameOver={onGameOver} />;
  }
}

