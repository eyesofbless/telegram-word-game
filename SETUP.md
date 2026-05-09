# Telegram Word Game - Инструкция по запуску

## Что создано

Многопользовательская игра "Угадай слово" для Telegram Mini Apps с функциями:
- ✅ Ежедневное слово для всех игроков
- ✅ Механика угадывания (как Wordle)
- ✅ Таблица лидеров
- ✅ Статистика игрока
- ✅ Система очков
- ✅ Таймер и подсчет попыток

## Шаги для запуска

### 1. Установите зависимости

```bash
cd C:\web\what_if
npm install
```

### 2. Создайте Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Word Game Bot")
4. Введите username бота (например: "my_word_game_bot")
5. Скопируйте токен бота

### 3. Настройте окружение

Создайте файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Откройте `.env` и добавьте токен бота:

```
BOT_TOKEN=ваш_токен_от_botfather
WEB_APP_URL=https://your-ngrok-url.ngrok.io
PORT=3000
```

### 4. Запустите сервер локально

```bash
npm start
```

Сервер запустится на порту 3000.

### 5. Создайте публичный URL (для разработки)

Установите ngrok:
```bash
npm install -g ngrok
```

Запустите ngrok:
```bash
ngrok http 3000
```

Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`) и обновите его в `.env` файле в переменной `WEB_APP_URL`.

### 6. Настройте Mini App в BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newapp`
3. Выберите вашего бота
4. Введите название приложения: "Word Game"
5. Введите описание: "Угадай слово за 6 попыток!"
6. Загрузите иконку (512x512 px) - можно пропустить
7. Загрузите GIF/видео демо - можно пропустить
8. Введите URL приложения: ваш ngrok URL (например: `https://abc123.ngrok.io`)
9. Выберите Short name: `wordgame`
10. Готово!

### 7. Настройте кнопку меню (опционально)

В [@BotFather](https://t.me/BotFather):
```
/mybots
→ Выберите вашего бота
→ Bot Settings
→ Menu Button
→ Configure menu button
→ Введите URL: ваш ngrok URL
```

### 8. Протестируйте игру

1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Нажмите кнопку "🎮 Играть"
4. Игра откроется в Mini App!

## Команды бота

- `/start` - Начать игру
- `/stats` - Показать статистику
- `/leaderboard` - Таблица лидеров

## Деплой в продакшн

Для продакшн деплоя используйте:
- **Vercel** (для frontend)
- **Railway** / **Heroku** (для backend)
- **VPS** (DigitalOcean, AWS, etc.)

Обновите `WEB_APP_URL` на продакшн URL.

## Структура файлов

```
C:\web\what_if\
├── backend/
│   ├── server.js       # Express сервер + Telegram Bot
│   └── words.json      # База слов на русском
├── public/
│   ├── index.html      # Интерфейс игры
│   ├── styles.css      # Стили
│   └── game.js         # Игровая логика
├── package.json
├── .env.example
└── README.md
```

## Возможные проблемы

**Ошибка "Bot token is invalid":**
- Проверьте правильность токена в `.env`

**Mini App не открывается:**
- Убедитесь что ngrok запущен
- Проверьте что URL в BotFather совпадает с ngrok URL
- URL должен быть HTTPS

**База данных не создается:**
- Убедитесь что у вас есть права на запись в папку проекта

## Следующие шаги

- Добавить больше слов в `backend/words.json`
- Настроить деплой на сервер
- Добавить приватные комнаты для игры с друзьями
- Добавить достижения и бейджи
