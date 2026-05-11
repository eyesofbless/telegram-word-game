# 🎮 Telegram Word Game

Игра "Угадай слово" для Telegram Mini Apps на русском языке. Каждый день у всех игроков одно и то же слово из 5 букв: угадывайте, набирайте очки и поднимайтесь в лидерборде.

## 🚀 Быстрый старт

### 1) Установите зависимости

```bash
npm install
```

### 2) Создайте `.env`

```bash
cp .env.example .env
```

Минимальные настройки:

```env
BOT_TOKEN=your_bot_token_here
WEB_APP_URL=https://your-domain.com
PORT=3000
BOT_POLLING=false
```

`BOT_POLLING=false` удобно для локальной разработки фронта/API без запуска Telegram polling.

### 3) Запустите сервер

```bash
npm start
```

Сервер поднимается на `http://localhost:3000`.

### 4) Для Telegram Mini App используйте HTTPS URL

Для локальной разработки:

```bash
ngrok http 3000
```

После этого обновите `WEB_APP_URL` в `.env` и в настройках Mini App у `@BotFather`.

## 🎮 Как играть

1. Откройте бота и нажмите `/start`.
2. Нажмите кнопку `🎮 Играть`.
3. Введите слово из 5 букв и отправьте.
4. Цвета плиток после попытки:
   - 🟩 буква на правильном месте;
   - 🟨 буква есть в слове, но стоит не там;
   - ⬜ буквы в слове нет.
5. Количество попыток не ограничено (ряды добавляются автоматически).

## 🏆 Система очков

Очки начисляются только за победу:

- базовые: `100`;
- бонус за попытки:
  - `+ (7 - attempts) * 20`, если `attempts <= 6`;
  - `+ (11 - attempts) * 10`, если `attempts <= 10`;
  - `+ max(0, 20 - attempts)` для более поздних попыток;
- бонус за скорость: `max(0, 50 - floor(timeTaken / 10))`.

## 🤖 Команды бота

- `/start` — открыть игру;
- `/stats` — личная статистика;
- `/leaderboard` — топ игроков.

## 📁 Структура проекта

```text
what_if/
├── backend/
│   ├── server.js
│   └── words.json
├── public/
│   ├── index.html
│   ├── styles.css
│   └── game.js
├── .env.example
├── package.json
├── railway-deploy.md
├── start.bat
└── start.sh
```

## 🛠️ Стек

- Backend: Node.js, Express, `node-telegram-bot-api`;
- Database: SQLite3;
- Frontend: Vanilla JavaScript, HTML, CSS;
- Integrations: Telegram Mini Apps SDK.

## 📄 Лицензия

MIT
