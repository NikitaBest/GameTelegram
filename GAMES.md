# Система игр в проекте

## Текущие игры

### 1. Flappy Bird (gameId: 1)
- **Путь**: `src/game/flappy-bird/`
- **Описание**: Классическая игра - птица пролетает между трубами
- **Управление**: Тап/Клик или пробел
- **Очки**: За каждую пройденную трубу
- **Проигрыш**: При столкновении с трубами или границами

### 2. Космическая игра (gameId: 2)
- **Путь**: `src/game/game cosmos/`
- **Описание**: Космический корабль собирает звезды и избегает астероидов
- **Управление**: Touch/Drag или клавиатура (стрелки)
- **Очки**: За собранные звезды
- **Проигрыш**: При столкновении с астероидами (3 жизни)

## Как работает роутинг игр

1. **Бекенд отправляет `gameId`** в ответе `/participating/start`
2. **DrawPage получает `gameId`** из `draw.gameId`
3. **DrawPage передает `gameId`** в App.jsx через callback `onGameIdReceived`
4. **App.jsx сохраняет `gameId`** в состоянии
5. **GameRouter выбирает игру** на основе `gameId`:
   - `gameId: 1` → Flappy Bird
   - `gameId: 2` → Космическая игра
   - `gameId: null` или неизвестный → Flappy Bird (по умолчанию)

## Как добавить новую игру

### Шаг 1: Создайте папку с игрой

```bash
mkdir src/game/my-new-game
```

### Шаг 2: Создайте компонент игры

Создайте файл `MyNewGame.tsx` в папке игры:

```tsx
import { useState } from 'react';

interface MyNewGameProps {
  onGameOver: (score: number) => void;
}

export function MyNewGame({ onGameOver }: MyNewGameProps) {
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Ваша игровая логика здесь

  const handleGameOver = () => {
    setIsGameOver(true);
    onGameOver(score);
  };

  return (
    <div className="my-new-game">
      {/* Ваш UI игры */}
      <div>Очки: {score}</div>
    </div>
  );
}
```

### Шаг 3: Добавьте игру в GameRouter

Откройте `src/game/GameRouter.tsx` и добавьте case:

```tsx
import { MyNewGame } from './my-new-game/MyNewGame';

export function GameRouter({ gameId, onGameOver }: GameRouterProps) {
  const selectedGameId = gameId || 1;

  switch (selectedGameId) {
    case 1:
      return <CosmosGame onGameOver={onGameOver} />;
    
    case 2:
      return <FlappyBirdGame onGameOver={onGameOver} />;
    
    case 3: // Новый gameId для вашей игры
      return <MyNewGame onGameOver={onGameOver} />;
    
    default:
      return <FlappyBirdGame onGameOver={onGameOver} />;
  }
}
```

### Шаг 4: Настройте бекенд

Убедитесь, что бекенд возвращает правильный `gameId` в ответе `/participating/start`:

```json
{
  "value": {
    "draw": {
      "gameId": 3  // ID вашей новой игры
    }
  }
}
```

## Требования к игре

### Обязательный интерфейс

Все игры должны принимать пропс:
```tsx
interface GameProps {
  onGameOver: (score: number) => void;
}
```

### Обязательные функции

1. **onGameOver(score)** - вызывается когда игра заканчивается
   - `score` - финальное количество очков (число)

2. **Управление** - игра должна поддерживать:
   - Touch события (для мобильных)
   - Клавиатуру (опционально, для десктопа)

3. **Адаптивность** - игра должна работать на:
   - Мобильных устройствах (320px+)
   - Планшетах
   - Десктопе (опционально)

### Рекомендации

1. **Стилизация**:
   - Используйте градиенты в стиле проекта
   - Цвета: синие оттенки (#407AD3, #487ED2)
   - Шрифт: Rubik или Helvetica

2. **Производительность**:
   - Используйте `requestAnimationFrame` для игрового цикла
   - Оптимизируйте ре-рендеры через `useCallback` и `useMemo`
   - Используйте `transform` вместо изменения `left/top` для анимаций

3. **UX**:
   - Показывайте экран правил перед началом
   - Отображайте текущий счет во время игры
   - Показывайте "Game Over" экран после окончания

## Примеры простых игр для добавления

1. **Snake (Змейка)** - классическая игра
2. **Doodle Jump** - прыжки по платформам
3. **Endless Runner** - бегун с препятствиями
4. **Breakout/Arkanoid** - разбивание блоков
5. **2048** - головоломка с числами

## Отладка

Для отладки игр используйте:

```javascript
// В консоли браузера
console.log('GameId:', gameId);
console.log('Score:', score);
```

Или добавьте логирование в `GameRouter.tsx`:

```tsx
console.log(`Загружаем игру с ID: ${selectedGameId}`);
```

