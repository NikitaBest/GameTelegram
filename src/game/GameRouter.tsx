import { GameContainer as CosmosGame } from './game cosmos/GameContainer';
import { FlappyBirdGame } from './flappy-bird/FlappyBirdGame';

interface GameRouterProps {
  gameId: number | null;
  onGameOver: (score: number) => void;
}

/**
 * Роутер для выбора игры на основе gameId из бекенда
 * 
 * Игры:
 * - gameId: 1 - Flappy Bird
 * - gameId: 2 (или по умолчанию) - Космическая игра (game cosmos)
 * 
 * Для добавления новой игры:
 * 1. Создайте папку с игрой в src/game/
 * 2. Добавьте case в switch ниже
 * 3. Убедитесь, что игра принимает onGameOver(score: number)
 */
export function GameRouter({ gameId, onGameOver }: GameRouterProps) {
  // Если gameId не указан, используем космическую игру по умолчанию
  const selectedGameId = gameId || 2;

  // Отладка
  console.log('[GameRouter] Выбор игры:', {
    gameId,
    selectedGameId,
    willUseGame: selectedGameId === 1 ? 'Flappy Bird' : selectedGameId === 2 ? 'Cosmos' : 'Unknown'
  });

  switch (selectedGameId) {
    case 1:
      // Flappy Bird (первая игра)
      return <FlappyBirdGame onGameOver={onGameOver} />;
    
    case 2:
      // Космическая игра (основная игра по умолчанию)
      return <CosmosGame onGameOver={onGameOver} />;
    
    default:
      // Fallback на космическую игру
      console.warn(`Неизвестный gameId: ${gameId}, используем игру по умолчанию (Космическая игра)`);
      return <CosmosGame onGameOver={onGameOver} />;
  }
}

