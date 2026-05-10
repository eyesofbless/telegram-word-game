const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database setup
const db = new sqlite3.Database('./game.db', (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS daily_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER,
    date TEXT,
    word TEXT,
    attempts INTEGER,
    won BOOLEAN,
    score INTEGER,
    time_taken INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS daily_words (
    date TEXT PRIMARY KEY,
    word TEXT NOT NULL
  )`);
}

// Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = process.env.WEB_APP_URL;

  bot.sendMessage(chatId, 'Добро пожаловать в игру "Угадай слово"! 🎮\n\nУгадывайте слова, соревнуйтесь с друзьями и поднимайтесь в таблице лидеров!', {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 Играть', web_app: { url: webAppUrl } }
      ]]
    }
  });
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, user) => {
    if (err || !user) {
      bot.sendMessage(chatId, 'У вас пока нет статистики. Начните играть!');
      return;
    }

    const winRate = user.games_played > 0 ? ((user.games_won / user.games_played) * 100).toFixed(1) : 0;

    bot.sendMessage(chatId,
      `📊 Ваша статистика:\n\n` +
      `🎮 Игр сыграно: ${user.games_played}\n` +
      `🏆 Побед: ${user.games_won}\n` +
      `📈 Процент побед: ${winRate}%`
    );
  });
});

bot.onText(/\/leaderboard/, (msg) => {
  const chatId = msg.chat.id;

  db.all('SELECT username, first_name, games_won, total_score FROM users ORDER BY total_score DESC LIMIT 10', [], (err, rows) => {
    if (err || rows.length === 0) {
      bot.sendMessage(chatId, 'Таблица лидеров пока пуста!');
      return;
    }

    let message = '🏆 Топ-10 игроков:\n\n';
    rows.forEach((row, index) => {
      const name = row.username || row.first_name || 'Аноним';
      message += `${index + 1}. ${name} - ${row.total_score} очков (${row.games_won} побед)\n`;
    });

    bot.sendMessage(chatId, message);
  });
});

// API Routes
app.post('/api/user/init', (req, res) => {
  const { telegram_id, username, first_name } = req.body;

  db.run(
    `INSERT OR REPLACE INTO users (telegram_id, username, first_name)
     VALUES (?, ?, ?)`,
    [telegram_id, username, first_name],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
});

app.get('/api/user/:telegram_id', (req, res) => {
  const telegramId = req.params.telegram_id;

  db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(user || null);
  });
});

app.get('/api/daily-word', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT word FROM daily_words WHERE date = ?', [today], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      return res.json({ word: row.word, date: today });
    }

    // Generate new word for today
    const words = require('./words.json');
    const randomWord = words[Math.floor(Math.random() * words.length)];

    db.run('INSERT INTO daily_words (date, word) VALUES (?, ?)', [today, randomWord], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ word: randomWord, date: today });
    });
  });
});

app.post('/api/game/complete', (req, res) => {
  const { telegram_id, word, attempts, won, score, time_taken } = req.body;
  const today = new Date().toISOString().split('T')[0];

  // Check if already played today
  db.get(
    'SELECT * FROM daily_games WHERE telegram_id = ? AND date = ?',
    [telegram_id, today],
    (err, game) => {
      if (game) {
        return res.status(400).json({ error: 'Already played today' });
      }

      // Save game
      db.run(
        `INSERT INTO daily_games (telegram_id, date, word, attempts, won, score, time_taken)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [telegram_id, today, word, attempts, won ? 1 : 0, score, time_taken],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Update user stats
          db.run(
            `UPDATE users
             SET games_played = games_played + 1,
                 games_won = games_won + ?,
                 total_score = total_score + ?
             WHERE telegram_id = ?`,
            [won ? 1 : 0, score, telegram_id],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.json({ success: true });
            }
          );
        }
      );
    }
  );
});

app.get('/api/leaderboard', (req, res) => {
  db.all(
    'SELECT username, first_name, games_won, total_score FROM users ORDER BY total_score DESC LIMIT 10',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

app.get('/api/today-played/:telegram_id', (req, res) => {
  const telegramId = req.params.telegram_id;
  const today = new Date().toISOString().split('T')[0];

  db.get(
    'SELECT * FROM daily_games WHERE telegram_id = ? AND date = ?',
    [telegramId, today],
    (err, game) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ played: !!game, game: game || null });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
