# 🚂 Деплой на Railway.app - Пошаговая инструкция

## Шаг 1: Подготовка проекта (1 минута)

Сначала нужно загрузить проект на GitHub.

### 1.1 Инициализируйте Git (если еще не сделали)

```bash
cd C:\web\what_if
git init
git add .
git commit -m "Initial commit: Telegram Word Game"
```

### 1.2 Создайте репозиторий на GitHub

1. Зайдите на https://github.com
2. Нажмите "New repository"
3. Название: `telegram-word-game`
4. Сделайте Public или Private
5. НЕ добавляйте README, .gitignore (у нас уже есть)
6. Create repository

### 1.3 Загрузите код на GitHub

```bash
git remote add origin https://github.com/ваш_username/telegram-word-game.git
git branch -M main
git push -u origin main
```

## Шаг 2: Деплой на Railway (3 минуты)

### 2.1 Зарегистрируйтесь

1. Откройте https://railway.app
2. Нажмите "Start a New Project"
3. Войдите через GitHub (Login with GitHub)
4. Разрешите доступ Railway к GitHub

### 2.2 Создайте проект

1. Нажмите "Deploy from GitHub repo"
2. Выберите репозиторий `telegram-word-game`
3. Нажмите "Deploy Now"

### 2.3 Добавьте переменные окружения

1. В проекте откройте вкладку "Variables"
2. Добавьте переменные:
   - `BOT_TOKEN` = ваш_токен_от_botfather
   - `PORT` = 3000
3. Нажмите "Add" для каждой

### 2.4 Получите URL

1. Откройте вкладку "Settings"
2. Найдите "Domains"
3. Нажмите "Generate Domain"
4. Скопируйте URL (например: `https://telegram-word-game-production.up.railway.app`)

### 2.5 Добавьте WEB_APP_URL

1. Вернитесь в "Variables"
2. Добавьте:
   - `WEB_APP_URL` = ваш_railway_url
3. Проект автоматически перезапустится

## Шаг 3: Настройте Mini App в BotFather

1. Откройте @BotFather в Telegram
2. Отправьте `/newapp`
3. Выберите вашего бота
4. Title: `Word Game`
5. Description: `Угадай слово за 6 попыток!`
6. Photo: `/empty`
7. Demo: `/empty`
8. Web App URL: `https://telegram-word-game-production.up.railway.app`
9. Short name: `wordgame`

## Шаг 4: Тестируйте! 🎉

1. Найдите бота в Telegram
2. Отправьте `/start`
3. Нажмите "🎮 Играть"
4. Игра работает!

## Преимущества Railway:

✅ Бесплатный план (500 часов в месяц)
✅ Автоматический деплой при push в GitHub
✅ HTTPS из коробки
✅ Постоянный URL
✅ Логи и мониторинг

## Если нет GitHub:

Можно использовать Railway CLI:

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

