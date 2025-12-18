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
 * - gameId: 1 (или по умолчанию) - Flappy Bird
 * - gameId: 2 - Космическая игра (game cosmos)
 * 
 * Для добавления новой игры:
 * 1. Создайте папку с игрой в src/game/
 * 2. Добавьте case в switch ниже
 * 3. Убедитесь, что игра принимает onGameOver(score: number)
 */
export function GameRouter({ gameId, onGameOver }: GameRouterProps) {
  // Если gameId не указан, используем Flappy Bird по умолчанию
  const selectedGameId = gameId || 1;

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
      // Космическая игра (вторая игра)
      return <CosmosGame onGameOver={onGameOver} />;
    
    default:
      // Fallback на Flappy Bird
      console.warn(`Неизвестный gameId: ${gameId}, используем игру по умолчанию (Flappy Bird)`);
      return <FlappyBirdGame onGameOver={onGameOver} />;
  }
}

