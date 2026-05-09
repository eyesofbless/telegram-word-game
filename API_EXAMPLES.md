# Примеры использования API

## Инициализация пользователя

```javascript
POST /api/user/init
Content-Type: application/json

{
  "telegram_id": 123456789,
  "username": "john_doe",
  "first_name": "John"
}

Response: { "success": true }
```

## Получение данных пользователя

```javascript
GET /api/user/123456789

Response:
{
  "telegram_id": 123456789,
  "username": "john_doe",
  "first_name": "John",
  "games_played": 15,
  "games_won": 10,
  "total_score": 1250,
  "created_at": "2026-05-01T10:00:00.000Z"
}
```

## Получение слова дня

```javascript
GET /api/daily-word

Response:
{
  "word": "СЛОВО",
  "date": "2026-05-09"
}
```

## Проверка игры за сегодня

```javascript
GET /api/today-played/123456789

Response:
{
  "played": true,
  "game": {
    "id": 42,
    "telegram_id": 123456789,
    "date": "2026-05-09",
    "word": "СЛОВО",
    "attempts": 4,
    "won": true,
    "score": 140,
    "time_taken": 95
  }
}
```

## Завершение игры

```javascript
POST /api/game/complete
Content-Type: application/json

{
  "telegram_id": 123456789,
  "word": "СЛОВО",
  "attempts": 4,
  "won": true,
  "score": 140,
  "time_taken": 95
}

Response: { "success": true }
```

## Таблица лидеров

```javascript
GET /api/leaderboard

Response:
[
  {
    "username": "john_doe",
    "first_name": "John",
    "games_won": 10,
    "total_score": 1250
  },
  {
    "username": "jane_smith",
    "first_name": "Jane",
    "games_won": 8,
    "total_score": 980
  }
]
```

## Примеры использования в коде

### Инициализация игры

```javascript
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user;

// Инициализация пользователя
await fetch('/api/user/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    telegram_id: user.id,
    username: user.username,
    first_name: user.first_name
  })
});

// Получение слова дня
const response = await fetch('/api/daily-word');
const { word } = await response.json();
```

### Проверка результата

```javascript
function checkGuess(guess, word) {
  const result = [];
  const wordArray = word.split('');
  const guessArray = guess.split('');
  
  // Проверка каждой буквы
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === wordArray[i]) {
      result.push('correct');
    } else if (wordArray.includes(guessArray[i])) {
      result.push('present');
    } else {
      result.push('absent');
    }
  }
  
  return result;
}
```

### Подсчет очков

```javascript
function calculateScore(won, attempts, timeTaken) {
  if (!won) return 0;
  
  let score = 100; // Базовые очки
  score += (6 - attempts) * 20; // Бонус за попытки
  score += Math.max(0, 50 - Math.floor(timeTaken / 10)); // Бонус за скорость
  
  return score;
}

// Примеры:
// 1 попытка, 10 секунд = 100 + 100 + 49 = 249 очков
// 3 попытки, 60 секунд = 100 + 60 + 44 = 204 очка
// 6 попыток, 180 секунд = 100 + 0 + 32 = 132 очка
```

### Сохранение результата

```javascript
async function saveGame(won, attempts, timeTaken) {
  const score = calculateScore(won, attempts, timeTaken);
  
  await fetch('/api/game/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegram_id: user.id,
      word: currentWord,
      attempts: attempts,
      won: won,
      score: score,
      time_taken: timeTaken
    })
  });
}
```

## Telegram Bot команды

### Обработка /start

```javascript
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, 'Добро пожаловать! 🎮', {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 Играть', web_app: { url: WEB_APP_URL } }
      ]]
    }
  });
});
```

### Обработка /stats

```javascript
bot.onText(/\/stats/, async (msg) => {
  const telegramId = msg.from.id;
  
  const user = await db.get(
    'SELECT * FROM users WHERE telegram_id = ?',
    [telegramId]
  );
  
  if (user) {
    const winRate = ((user.games_won / user.games_played) * 100).toFixed(1);
    
    bot.sendMessage(msg.chat.id,
      `📊 Статистика:\n` +
      `🎮 Игр: ${user.games_played}\n` +
      `🏆 Побед: ${user.games_won}\n` +
      `📈 Процент: ${winRate}%\n` +
      `⭐ Очки: ${user.total_score}`
    );
  }
});
```
