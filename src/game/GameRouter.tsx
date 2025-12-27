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
 * - gameId: 1 - Космическая игра (game cosmos)
 * - gameId: 2 - Ball and Wall (ball and wall, игра по умолчанию)
 * - gameId: 3 - Flappy Bird
 * 
 * Для добавления новой игры:
 * 1. Создайте папку с игрой в src/game/
 * 2. Добавьте case в switch ниже
 * 3. Убедитесь, что игра принимает onGameOver(score: number)
 */
export function GameRouter({ gameId, onGameOver }: GameRouterProps) {
  // Если gameId не указан, используем Ball and Wall по умолчанию
  const selectedGameId = gameId || 2;

  // Отладка
  console.log('[GameRouter] Выбор игры:', {
    gameId,
    selectedGameId,
    willUseGame: selectedGameId === 1 ? 'Cosmos' : selectedGameId === 2 ? 'Ball and Wall' : selectedGameId === 3 ? 'Flappy Bird' : 'Unknown'
  });

  switch (selectedGameId) {
    case 1:
      // Космическая игра
      return <CosmosGame onGameOver={onGameOver} />;
    
    case 2:
      // Ball and Wall (игра по умолчанию)
      return <BallAndWallGame onGameOver={onGameOver} />;
    
    case 3:
      // Flappy Bird
      return <FlappyBirdGame onGameOver={onGameOver} />;
    
    default:
      // Fallback на Ball and Wall
      console.warn(`Неизвестный gameId: ${gameId}, используем игру по умолчанию (Ball and Wall)`);
      return <BallAndWallGame onGameOver={onGameOver} />;
  }
}

