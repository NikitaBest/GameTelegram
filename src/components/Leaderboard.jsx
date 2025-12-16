import { useState, useEffect, useRef, useCallback } from 'react';
import { getLeaderboard } from '../api/services/leaderboardService';
import './Leaderboard.css';

const Leaderboard = ({ drawId, userId }) => {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef(null);
  
  // Загрузка дополнительных данных при прокрутке
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !drawId) return;

    setLoadingMore(true);

    // Загружаем следующую порцию (увеличиваем CountAfter)
    // CountBefore остается 10, CountAfter увеличиваем на 20
    const currentAfter = Math.max(10, leaders.length - 10); // Учитываем, что первые 10 уже загружены
    const newAfter = currentAfter + 20;
    
    getLeaderboard(drawId, 10, newAfter)
      .then((response) => {
        if (response.isSuccess && response.value) {
          const newItems = response.value.items || [];
          // Берем только новые элементы (которые еще не загружены)
          const existingIds = new Set(leaders.map(l => l.participatingId));
          const uniqueNewItems = newItems.filter(item => !existingIds.has(item.participatingId));
          
          if (uniqueNewItems.length > 0) {
            setLeaders(prev => {
              const updated = [...prev, ...uniqueNewItems];
              const total = response.value.totalCount || totalCount;
              setTotalCount(total);
              if (updated.length >= total) {
                setHasMore(false);
              }
              return updated;
            });
          } else {
            setHasMore(false);
          }
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
  }, [drawId, leaders, loadingMore, hasMore, totalCount]);

  const lastLeaderRef = useCallback((node) => {
    if (isLoading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      {
        root: null, // Используем viewport как root для отслеживания прокрутки страницы
        rootMargin: '200px', // Начинаем загрузку за 200px до конца списка
        threshold: 0.1,
      }
    );
    if (node) observerRef.current.observe(node);
  }, [isLoading, loadingMore, hasMore, loadMore]);

  // Загружаем начальный список лидеров
  useEffect(() => {
    if (drawId) {
      setIsLoading(true);
      setError(null);

      getLeaderboard(drawId, 10, 10)
        .then((response) => {
          if (response.isSuccess && response.value) {
            const items = response.value.items || [];
            setLeaders(items);
            const total = response.value.totalCount || 0;
            setTotalCount(total);
            // Проверяем, есть ли еще данные для загрузки
            setHasMore(items.length < total);
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
  }, [drawId]);

  const getMedalIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
  };

  const getDisplayName = (user) => {
    if (user.userName) return `@${user.userName}`;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return 'Пользователь';
  };

  if (isLoading) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-loading">Загрузка списка лидеров...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-error">{error}</div>
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-empty">Список лидеров пуст</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h3 className="leaderboard-title">Таблица лидеров</h3>
      <div className="leaderboard-list">
        {leaders.map((leader, index) => {
          const isLast = index === leaders.length - 1;
          const isCurrentUser = userId && leader.userId === userId;
          const medal = getMedalIcon(leader.topNumber);
          
          return (
            <div
              key={leader.participatingId}
              ref={isLast ? lastLeaderRef : null}
              className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="leaderboard-position">
                {medal ? (
                  <span className="leaderboard-medal">{medal}</span>
                ) : (
                  <span className="leaderboard-number">{leader.topNumber}</span>
                )}
              </div>
              
              <div className="leaderboard-avatar">
                {leader.photoUrl ? (
                  <img 
                    src={leader.photoUrl} 
                    alt={getDisplayName(leader)}
                    className="leaderboard-avatar-img"
                  />
                ) : (
                  <div className="leaderboard-avatar-placeholder">
                    {leader.firstName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              <div className="leaderboard-info">
                <div className="leaderboard-name">{getDisplayName(leader)}</div>
                <div className="leaderboard-points">{leader.maxPointsAlias || `${leader.maxPoints} очков`}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {loadingMore && (
        <div className="leaderboard-loading-more">Загрузка...</div>
      )}
      
      {!hasMore && leaders.length > 0 && (
        <div className="leaderboard-end">Все лидеры загружены</div>
      )}
    </div>
  );
};

export default Leaderboard;

