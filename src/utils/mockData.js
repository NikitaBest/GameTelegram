// Мок данные для розыгрыша

export const mockDrawData = {
  // Баланс пользователя
  balance: 8.5,
  
  // Время до конца розыгрыша (в секундах)
  timeUntilEnd: 11 * 3600 + 54 * 60 + 27, // 11:54:27
  
  // Призовой фонд
  prizeFund: {
    total: 500, // Общая сумма призового фонда
    currency: 'P' // Валюта (Points)
  },
  
  // Призы за места
  prizes: [
    {
      place: 1,
      label: 'Приз за 1 место',
      amount: 150,
      currency: 'P',
      icon: 'gold' // золотой трофей
    },
    {
      place: 2,
      label: 'Приз за 2 место',
      amount: 120,
      currency: 'P',
      icon: 'silver' // серебряный трофей
    },
    {
      place: 3,
      label: 'Приз за 3 место',
      amount: 100,
      currency: 'P',
      icon: 'bronze' // бронзовый трофей
    },
    {
      place: '4-10',
      label: 'Приз за 4 - 10 места',
      amount: 50,
      currency: 'P',
      icon: 'silver' // серебряный трофей
    }
  ],
  
  // Звезды для участников
  starsForParticipants: {
    minAmount: 11,
    description: 'Всем участникам звёзды',
    note: 'Чем выше место тем больше звёзд!',
    iconCount: 2 // количество звезд в иконке
  },
  
  // Место пользователя
  userRank: {
    place: 178,
    label: 'Ты на 178 месте'
  },
  
  // Иконки для призового фонда (Steam, звезды и т.д.)
  prizeFundIcons: [
    {
      type: 'steam',
      color: 'light-blue'
    },
    {
      type: 'star',
      color: 'purple'
    }
  ]
};

// Функция для форматирования времени
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(secs).padStart(2, '0')
  };
};

// Мок данные для страницы "Путь к сокровищам"
export const mockSubscriptionData = {
  title: 'Путь к сокровищам',
  subtitle: 'Подписка до конца розыгрыша – обязательное условие участия',
  totalSteps: 3,
  tasks: [
    {
      id: 1,
      title: 'Канал Техно-Новостей',
      completed: false,
      channelId: '@techno_news',
      channelUrl: 'https://t.me/techno_news'
    },
    {
      id: 2,
      title: 'Игровая Индустрия, как она есть',
      completed: false,
      channelId: '@gaming_industry',
      channelUrl: 'https://t.me/gaming_industry'
    },
    {
      id: 3,
      title: 'Подпишитесь на нашего бота',
      completed: false,
      channelId: '@game_bot',
      channelUrl: 'https://t.me/game_bot'
    }
  ]
};

