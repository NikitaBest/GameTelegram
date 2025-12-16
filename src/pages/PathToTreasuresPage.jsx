import { useState, useEffect } from 'react';
import BackgroundStars from '../components/BackgroundStars';
import ProgressBar from '../components/ProgressBar';
import TaskList from '../components/TaskList';
import ForwardButton from '../components/ForwardButton';
import { checkPartnersSubscription } from '../api/services/partnersService';
import { useAuth } from '../hooks/useAuth';
import './PathToTreasuresPage.css';

const PathToTreasuresPage = ({ drawId, onStartGame }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [partners, setPartners] = useState([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [allSubscribed, setAllSubscribed] = useState(false);
  
  // Загружаем данные о подписках партнеров при монтировании компонента
  useEffect(() => {
    // Логируем для отладки
    if (import.meta.env.DEV) {
      console.log('PathToTreasuresPage: проверка условий для загрузки подписок:', {
        drawId,
        isAuthenticated,
        authLoading,
        shouldLoad: drawId && isAuthenticated && !authLoading,
      });
    }
    
    // Проверяем подписки только если есть drawId и пользователь авторизован
    if (drawId && isAuthenticated && !authLoading) {
      setIsLoadingPartners(true);
      
      if (import.meta.env.DEV) {
        console.log(`Запрос проверки подписок партнеров для розыгрыша ID: ${drawId}`);
      }
      
      checkPartnersSubscription(drawId)
        .then((response) => {
          console.log('Данные о подписках партнеров:', response);
          
          if (response.isSuccess && response.value) {
            const partnersData = response.value.items || [];
            setPartners(partnersData);
            
            // Проверяем, все ли подписаны
            const allSubscribedCheck = partnersData.length > 0 && 
              partnersData.every(partner => partner.subscribed);
            setAllSubscribed(allSubscribedCheck);
            
            // Если success: true, значит все подписки выполнены - переходим на страницу draw
            if (response.value.success) {
              console.log('Все подписки выполнены, переход на страницу draw');
              // Небольшая задержка для плавного перехода
              setTimeout(() => {
                onStartGame?.();
              }, 500);
            }
          } else {
            console.error('Ошибка в ответе от бекенда:', response.error);
          }
        })
        .catch((error) => {
          console.error('Ошибка при загрузке подписок партнеров:', error);
          // В случае ошибки показываем пустой список
          setPartners([]);
        })
        .finally(() => {
          setIsLoadingPartners(false);
        });
    } else if (!drawId && import.meta.env.DEV) {
      console.warn('PathToTreasuresPage: drawId отсутствует, проверка подписок не выполняется');
      setIsLoadingPartners(false);
    }
  }, [drawId, isAuthenticated, authLoading, onStartGame]);
  
  // Пересчитываем количество подписанных партнеров
  const subscribedCount = partners.filter(partner => partner.subscribed).length;
  const totalPartners = partners.length;
  
  const handlePartnerClick = (task) => {
    // Если партнер не подписан, открываем ссылку для подписки
    if (!task.completed && task.link) {
      // Открываем ссылку в новом окне
      window.open(task.link, '_blank');
      
      // После открытия ссылки обновляем данные через некоторое время
      // Это позволит проверить подписку после возврата из Telegram
      setTimeout(() => {
        if (drawId && isAuthenticated) {
          checkPartnersSubscription(drawId)
            .then((response) => {
              if (response.isSuccess && response.value) {
                const partnersData = response.value.items || [];
                setPartners(partnersData);
                
                const allSubscribedCheck = partnersData.length > 0 && 
                  partnersData.every(partner => partner.subscribed);
                setAllSubscribed(allSubscribedCheck);
                
                // Если все подписки выполнены, переходим на draw
                if (response.value.success) {
                  console.log('Все подписки выполнены, переход на страницу draw');
                  setTimeout(() => {
                    onStartGame?.();
                  }, 500);
                }
              }
            })
            .catch((error) => {
              console.error('Ошибка при обновлении подписок:', error);
            });
        }
      }, 2000); // Обновляем через 2 секунды после открытия ссылки
    }
  };
  
  // Обновляем данные при фокусе окна (возврат из Telegram)
  useEffect(() => {
    const handleFocus = () => {
      if (drawId && isAuthenticated && !authLoading) {
        checkPartnersSubscription(drawId)
          .then((response) => {
            if (response.isSuccess && response.value) {
              const partnersData = response.value.items || [];
              setPartners(partnersData);
              
              const allSubscribedCheck = partnersData.length > 0 && 
                partnersData.every(partner => partner.subscribed);
              setAllSubscribed(allSubscribedCheck);
              
              if (response.value.success) {
                console.log('Все подписки выполнены, переход на страницу draw');
                setTimeout(() => {
                  onStartGame?.();
                }, 500);
              }
            }
          })
          .catch((error) => {
            console.error('Ошибка при обновлении подписок:', error);
          });
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [drawId, isAuthenticated, authLoading, onStartGame]);
  
  const handleForwardClick = () => {
    if (allSubscribed && totalPartners > 0) {
      // Переход к странице с призами (DrawPage)
      onStartGame?.();
    }
  };
  
  // Преобразуем партнеров в формат для TaskList
  const tasks = partners.map((partner, index) => ({
    id: partner.partnerId,
    title: partner.name,
    completed: partner.subscribed,
    link: partner.link,
    partnerId: partner.partnerId,
  }));

  return (
    <div className="path-to-treasures-page">
      <BackgroundStars />
      {/* Дорожка на фоне */}
      <div className="path-background">
        <img src="/Vector 17.svg" alt="" className="path-image" />
      </div>
      <div className="path-content">
        <div className="title-block">
          <h1 className="page-title">Путь к сокровищам</h1>
          <p className="page-subtitle">Подписка до конца розыгрыша – обязательное условие участия</p>
        </div>
        
        {isLoadingPartners ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
            Загрузка партнеров...
          </div>
        ) : (
          <>
            <ProgressBar
              currentStep={subscribedCount}
              totalSteps={totalPartners || 1}
            />
            
            {totalPartners > 0 ? (
              <TaskList 
                tasks={tasks} 
                onTaskClick={handlePartnerClick}
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                Партнеры не найдены
              </div>
            )}
            
            <ForwardButton 
              onClick={handleForwardClick}
              disabled={!allSubscribed || totalPartners === 0}
              text={allSubscribed && totalPartners > 0 ? 'Начать игру' : 'Вперёд!'}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PathToTreasuresPage;

