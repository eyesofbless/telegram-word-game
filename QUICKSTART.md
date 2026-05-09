# Быстрый старт - 5 минут

## Шаг 1: Установка (30 сек)

```bash
cd C:\web\what_if
npm install
```

## Шаг 2: Создание бота (2 мин)

1. Откройте https://t.me/BotFather
2. Отправьте: `/newbot`
3. Имя: `My Word Game`
4. Username: `my_word_game_bot` (должен быть уникальным)
5. **Скопируйте токен!**

## Шаг 3: Настройка .env (30 сек)

Создайте файл `.env`:

```env
BOT_TOKEN=ваш_токен_здесь
WEB_APP_URL=http://localhost:3000
PORT=3000
```

## Шаг 4: Запуск (30 сек)

```bash
npm start
```

Сервер запустится на http://localhost:3000

## Шаг 5: Тестирование локально (1 мин)

Откройте в браузере: http://localhost:3000

Игра работает! Но для Telegram нужен публичный URL...

## Шаг 6: Публичный URL с ngrok (1 мин)

```bash
# Установите ngrok (один раз)
npm install -g ngrok

# Запустите ngrok
ngrok http 3000
```

Скопируйте HTTPS URL (например: `https://abc123.ngrok-free.app`)

Обновите `.env`:
```env
WEB_APP_URL=https://abc123.ngrok-free.app
```

Перезапустите сервер: `npm start`

## Шаг 7: Подключение к Telegram (1 мин)

В [@BotFather](https://t.me/BotFather):

```
/newapp
→ Выберите вашего бота
→ Title: Word Game
→ Description: Угадай слово!
→ Photo: [пропустить]
→ Demo: [пропустить]
→ Web App URL: https://abc123.ngrok-free.app
→ Short name: wordgame
```

## Готово! 🎉

Найдите вашего бота в Telegram → `/start` → "🎮 Играть"

---

## Альтернатива: Деплой на Vercel (бесплатно)

Для постоянного URL без ngrok:

```bash
npm install -g vercel
vercel
```

Следуйте инструкциям и используйте полученный URL в BotFather.

---

## Проблемы?

**"Bot token is invalid"** → Проверьте токен в `.env`

**Mini App не открывается** → Убедитесь что ngrok запущен и URL правильный

**База данных не создается** → Проверьте права на запись в папке проекта
