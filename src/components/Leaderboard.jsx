import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { getLeaderboard } from '../api/services/leaderboardService';
import './Leaderboard.css';

// Мемоизированный компонент элемента лидерборда для оптимизации рендеринга
const LeaderboardItem = memo(({ leader, isLast, isCurrentUser, userId, onLastItemRef, getCupIcon, getDisplayName }) => {
  const position = leader.topNumber;
  
  // Мемоизируем вычисления класса позиции
  const positionClass = useMemo(() => {
    if (position === 1) return 'place-1';
    if (position === 2) return 'place-2';
    if (position === 3) return 'place-3';
    return 'place-other';
  }, [position]);

  const cupIcon = useMemo(() => getCupIcon(position), [position, getCupIcon]);
  const displayName = useMemo(() => getDisplayName(leader), [leader, getDisplayName]);

  return (
    <div
      ref={isLast ? onLastItemRef : null}
      className={`leaderboard-item ${positionClass} ${isCurrentUser ? 'current-user' : ''}`}
    >
      {/* Аватар слева */}
      <div className="leaderboard-avatar">
        {leader.photoUrl ? (
          <img 
            src={leader.photoUrl} 
            alt={displayName}
            className="leaderboard-avatar-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="leaderboard-avatar-placeholder">
            {leader.firstName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      
      {/* Имя и очки в центре */}
      <div className="leaderboard-info">
        <div className="leaderboard-name">{displayName}</div>
        <div className="leaderboard-points-badge">
          <img src="/Icons.svg" alt="" className="leaderboard-points-icon" loading="lazy" />
          <span className="leaderboard-points-value">{leader.maxPoints ?? 0}</span>
        </div>
      </div>
      
      {/* Кубок с номером справа */}
      <div className="leaderboard-cup">
        <img src={cupIcon} alt={`Место ${position}`} className="leaderboard-cup-img" loading="lazy" />
        <span className="leaderboard-cup-number">{position}</span>
      </div>
    </div>
  );
});

LeaderboardItem.displayName = 'LeaderboardItem';

const Leaderboard = ({ drawId, userId, hideHeader = false }) => {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  
  // Загрузка дополнительных данных при прокрутке с оптимизацией
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !drawId) return;

    // Отменяем предыдущий таймаут, если он есть
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Небольшая задержка для предотвращения множественных запросов
    loadingTimeoutRef.current = setTimeout(() => {
      setLoadingMore(true);

      // Вычисляем следующий диапазон: загружаем по 100 участников
      // fromNumber = текущее количество + 1
      // toNumber = fromNumber + 99 (всего 100 участников)
      const currentCount = leaders.length;
      const fromNumber = currentCount + 1;
      const toNumber = fromNumber + 99;
      
      getLeaderboard(drawId, fromNumber, toNumber)
        .then((response) => {
          if (response.isSuccess && response.value) {
            const newItems = response.value.items || [];
            // Берем только новые элементы (которые еще не загружены)
            setLeaders(prev => {
              const existingIds = new Set(prev.map(l => l.participatingId));
              const uniqueNewItems = newItems.filter(item => !existingIds.has(item.participatingId));
              
              if (uniqueNewItems.length > 0) {
                const updated = [...prev, ...uniqueNewItems];
                const total = response.value.totalCount || totalCount;
                setTotalCount(total);
                // Если загрузили меньше 100 или достигли общего количества, значит больше нет данных
                if (uniqueNewItems.length < 100 || updated.length >= total) {
                  setHasMore(false);
                }
                return updated;
              } else {
                setHasMore(false);
                return prev;
              }
            });
          } else {
            setHasMore(false);
          }
        })
        .catch((err) => {
          console.error('Ошибка при загрузке дополнительных лидеров:', err);
          setHasMore(false);
        })
        .finally(() => {
          setLoadingMore(false);
        });
    }, 100); // Небольшая задержка для батчинга
  }, [drawId, leaders.length, loadingMore, hasMore, totalCount]);

  const lastLeaderRef = useCallback((node) => {
    if (isLoading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    // Оптимизированный IntersectionObserver с debounce
    let timeoutId = null;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          // Debounce для предотвращения множественных вызовов
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            loadMore();
          }, 150);
        }
      },
      {
        root: null, // Используем viewport как root для отслеживания прокрутки страницы
        rootMargin: '300px', // Увеличиваем до 300px для более ранней загрузки
        threshold: 0.01, // Уменьшаем threshold для более раннего срабатывания
      }
    );
    if (node) observerRef.current.observe(node);
    
    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, loadingMore, hasMore, loadMore]);

  // Загружаем начальный список лидеров
  useEffect(() => {
    if (drawId) {
      setIsLoading(true);
      setError(null);

      // Загружаем первые 100 участников (с 1 по 100 место)
      getLeaderboard(drawId, 1, 100)
        .then((response) => {
          if (response.isSuccess && response.value) {
            const items = response.value.items || [];
            setLeaders(items);
            const total = response.value.totalCount || 0;
            setTotalCount(total);
            // Проверяем, есть ли еще данные для загрузки
            // Если загрузили меньше 100 или достигли общего количества, значит больше нет данных
            setHasMore(items.length === 100 && items.length < total);
          } else {
            setError(response.error || 'Ошибка при загрузке списка лидеров');
          }
        })
        .catch((err) => {
          console.error('Ошибка при загрузке списка лидеров:', err);
          setError(err.message || 'Не удалось загрузить список лидеров');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    // Cleanup при размонтировании
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [drawId]);

  // Мемоизируем функции для предотвращения лишних ре-рендеров
  const getCupIcon = useCallback((position) => {
    if (position === 1) return '/1st-1.png';
    if (position === 2) return '/2nd-1.png';
    if (position === 3) return '/3rd-1.png';
    return '/4rth-10th-1-7.png';
  }, []);

  const getDisplayName = useCallback((user) => {
    if (user.userName) return `@${user.userName}`;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return 'Пользователь';
  }, []);

  return (
    <div className="leaderboard-container">
      {!hideHeader && (
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Лидеры</h3>
          {totalCount > 0 && (
            <div className="leaderboard-count">
              <img 
                src="/fa-solid_user-friends.svg" 
                alt="Участники" 
                className="leaderboard-count-icon"
              />
              <span>{totalCount} участников</span>
            </div>
          )}
        </div>
      )}
      {leaders.length > 0 ? (
        <>
          <div className="leaderboard-list">
            {leaders.map((leader, index) => {
              const isLast = index === leaders.length - 1;
              const isCurrentUser = userId && leader.userId === userId;
              
              return (
                <LeaderboardItem
                  key={leader.participatingId}
                  leader={leader}
                  isLast={isLast}
                  isCurrentUser={isCurrentUser}
                  userId={userId}
                  onLastItemRef={lastLeaderRef}
                  getCupIcon={getCupIcon}
                  getDisplayName={getDisplayName}
                />
              );
            })}
          </div>
          
          {loadingMore && (
            <div className="leaderboard-loading-more">Загрузка...</div>
          )}
          
          {!hasMore && leaders.length > 0 && (
            <div className="leaderboard-end">Все лидеры загружены</div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default Leaderboard;

