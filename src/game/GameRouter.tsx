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
 * - gameId: 2 - Flappy Bird (игра по умолчанию)
 * - gameId: 3 - Ball and Wall (ball and wall)
 * 
 * Для добавления новой игры:
 * 1. Создайте папку с игрой в src/game/
 * 2. Добавьте case в switch ниже
 * 3. Убедитесь, что игра принимает onGameOver(score: number)
 */
export function GameRouter({ gameId, onGameOver }: GameRouterProps) {
  // Если gameId не указан, используем Flappy Bird по умолчанию
  const selectedGameId = gameId || 2;

  // Отладка
  console.log('[GameRouter] Выбор игры:', {
    gameId,
    selectedGameId,
    willUseGame: selectedGameId === 1 ? 'Cosmos' : selectedGameId === 2 ? 'Flappy Bird' : selectedGameId === 3 ? 'Ball and Wall' : 'Unknown'
  });

  switch (selectedGameId) {
    case 1:
      // Космическая игра
      return <CosmosGame onGameOver={onGameOver} />;
    
    case 2:
      // Flappy Bird (игра по умолчанию)
      return <FlappyBirdGame onGameOver={onGameOver} />;
    
    case 3:
      // Ball and Wall
      return <BallAndWallGame onGameOver={onGameOver} />;
    
    default:
      // Fallback на Flappy Bird
      console.warn(`Неизвестный gameId: ${gameId}, используем игру по умолчанию (Flappy Bird)`);
      return <FlappyBirdGame onGameOver={onGameOver} />;
  }
}

