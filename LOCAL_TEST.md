# 🚀 Запуск в Telegram на локалке

## Проблема
Telegram Mini Apps требуют HTTPS URL, а локальный сервер работает на HTTP.

## Решение: ngrok

### Шаг 1: Установите ngrok

```bash
npm install -g ngrok
```

Или скачайте с https://ngrok.com/download

### Шаг 2: Запустите ваш сервер

```bash
cd C:\web\what_if
npm install
npm start
```

Сервер запустится на http://localhost:3000

### Шаг 3: Запустите ngrok (в новом терминале)

```bash
ngrok http 3000
```

Вы увидите что-то вроде:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Скопируйте HTTPS URL!** (например: https://abc123.ngrok-free.app)

### Шаг 4: Обновите .env

Откройте `.env` файл и обновите:

```env
BOT_TOKEN=ваш_токен_от_botfather
WEB_APP_URL=https://abc123.ngrok-free.app
PORT=3000
```

**Перезапустите сервер** (Ctrl+C и снова `npm start`)

### Шаг 5: Создайте Mini App в BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте: `/newapp`
3. Выберите вашего бота
4. Title: `Word Game`
5. Description: `Угадай слово!`
6. Photo: отправьте `/empty`
7. Demo: отправьте `/empty`
8. **Web App URL**: `https://abc123.ngrok-free.app` (ваш ngrok URL)
9. Short name: `wordgame`

### Шаг 6: Тестируйте!

1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Нажмите "🎮 Играть"
4. Игра откроется! 🎉

## Важно!

- ngrok URL меняется при каждом перезапуске (бесплатная версия)
- Держите ngrok запущенным пока тестируете
- Держите сервер запущенным (`npm start`)

## Альтернатива: localtunnel

Если ngrok не работает:

```bash
npm install -g localtunnel
lt --port 3000
```

Используйте полученный URL вместо ngrok.

