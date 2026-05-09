// Telegram Web App initialization
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// API Base URL
const API_URL = window.location.origin;

// Game state
let currentWord = '';
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let startTime = Date.now();
let timerInterval = null;
let userData = null;

// Get user data from Telegram
const user = tg.initDataUnsafe?.user || {
    id: 123456789, // Demo user for testing
    first_name: 'Demo',
    username: 'demo_user'
};

// Initialize game
async function initGame() {
    try {
        // Initialize user in database
        await fetch(`${API_URL}/api/user/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: user.id,
                username: user.username,
                first_name: user.first_name
            })
        });

        // Load user data
        const userResponse = await fetch(`${API_URL}/api/user/${user.id}`);
        userData = await userResponse.json();

        // Update UI
        document.getElementById('username').textContent = user.first_name || user.username || 'Игрок';
        document.getElementById('score').textContent = `⭐ ${userData?.total_score || 0}`;

        // Check if already played today
        const playedResponse = await fetch(`${API_URL}/api/today-played/${user.id}`);
        const playedData = await playedResponse.json();

        if (playedData.played) {
            showAlreadyPlayedScreen(playedData.game);
            return;
        }

        // Get daily word
        const wordResponse = await fetch(`${API_URL}/api/daily-word`);
        const wordData = await wordResponse.json();
        currentWord = wordData.word.toUpperCase();

        console.log('Daily word:', currentWord); // For testing

        // Create game board
        createBoard();
        startTimer();
        setupKeyboard();

    } catch (error) {
        console.error('Init error:', error);
        tg.showAlert('Ошибка загрузки игры. Попробуйте позже.');
    }
}

function createBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'board-row';
        row.id = `row-${i}`;

        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${i}-${j}`;
            row.appendChild(tile);
        }

        board.appendChild(row);
    }
}

function setupKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.addEventListener('click', () => {
            const letter = key.dataset.key;
            handleKeyPress(letter);
        });
    });

    // Physical keyboard support
    document.addEventListener('keydown', (e) => {
        if (gameOver) return;

        if (e.key === 'Enter') {
            handleKeyPress('Enter');
        } else if (e.key === 'Backspace') {
            handleKeyPress('Backspace');
        } else if (/^[а-яА-ЯёЁ]$/.test(e.key)) {
            handleKeyPress(e.key.toUpperCase());
        }
    });
}

function handleKeyPress(key) {
    if (gameOver) return;

    if (key === 'Enter') {
        submitGuess();
    } else if (key === 'Backspace') {
        deleteLetter();
    } else {
        addLetter(key);
    }
}

function addLetter(letter) {
    if (currentTile < 5) {
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.textContent = letter;
        tile.classList.add('filled');
        currentTile++;
    }
}

function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.textContent = '';
        tile.classList.remove('filled');
    }
}

async function submitGuess() {
    if (currentTile !== 5) {
        tg.showAlert('Введите слово из 5 букв');
        return;
    }

    const guess = getCurrentGuess();

    // Check guess
    checkGuess(guess);

    document.getElementById('attempts').textContent = currentRow + 1;

    if (guess === currentWord) {
        // Win
        gameOver = true;
        stopTimer();
        setTimeout(() => {
            showResult(true);
        }, 1500);
    } else if (currentRow === 5) {
        // Lose
        gameOver = true;
        stopTimer();
        setTimeout(() => {
            showResult(false);
        }, 1500);
    } else {
        // Next row
        currentRow++;
        currentTile = 0;
    }
}

function getCurrentGuess() {
    let guess = '';
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        guess += tile.textContent;
    }
    return guess;
}

function checkGuess(guess) {
    const wordArray = currentWord.split('');
    const guessArray = guess.split('');
    const letterCount = {};

    // Count letters in word
    wordArray.forEach(letter => {
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    });

    // First pass: mark correct letters
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        const letter = guessArray[i];

        if (letter === wordArray[i]) {
            tile.classList.add('correct');
            updateKeyboard(letter, 'correct');
            letterCount[letter]--;
        }
    }

    // Second pass: mark present and absent letters
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        const letter = guessArray[i];

        if (letter !== wordArray[i]) {
            if (wordArray.includes(letter) && letterCount[letter] > 0) {
                tile.classList.add('present');
                updateKeyboard(letter, 'present');
                letterCount[letter]--;
            } else {
                tile.classList.add('absent');
                updateKeyboard(letter, 'absent');
            }
        }
    }
}

function updateKeyboard(letter, status) {
    const key = document.querySelector(`.key[data-key="${letter}"]`);
    if (key && !key.classList.contains('correct')) {
        key.classList.remove('present', 'absent', 'correct');
        key.classList.add(status);
    }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

function calculateScore(won, attempts, timeTaken) {
    if (!won) return 0;

    let score = 100;

    // Bonus for fewer attempts
    score += (6 - attempts) * 20;

    // Bonus for speed (max 50 points)
    const timeBonus = Math.max(0, 50 - Math.floor(timeTaken / 10));
    score += timeBonus;

    return score;
}

async function showResult(won) {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const attempts = currentRow + 1;
    const score = calculateScore(won, attempts, timeTaken);

    // Save game result
    try {
        await fetch(`${API_URL}/api/game/complete`, {
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
    } catch (error) {
        console.error('Error saving game:', error);
    }

    // Update UI
    document.getElementById('result-title').textContent = won ? '🎉 Победа!' : '😔 Не угадали';
    document.getElementById('result-word').textContent = currentWord;
    document.getElementById('result-attempts').textContent = `${attempts}/6`;

    const minutes = Math.floor(timeTaken / 60).toString().padStart(2, '0');
    const seconds = (timeTaken % 60).toString().padStart(2, '0');
    document.getElementById('result-time').textContent = `${minutes}:${seconds}`;
    document.getElementById('result-score').textContent = won ? `+${score}` : '0';

    showScreen('result-screen');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

async function showStats() {
    const response = await fetch(`${API_URL}/api/user/${user.id}`);
    const data = await response.json();

    if (data) {
        document.getElementById('total-games').textContent = data.games_played;
        document.getElementById('total-wins').textContent = data.games_won;
        const winRate = data.games_played > 0 ? ((data.games_won / data.games_played) * 100).toFixed(1) : 0;
        document.getElementById('win-rate').textContent = `${winRate}%`;
        document.getElementById('total-score-stat').textContent = data.total_score;
    }

    showScreen('stats-screen');
}

async function showLeaderboard() {
    const response = await fetch(`${API_URL}/api/leaderboard`);
    const data = await response.json();

    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    data.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';

        const rank = document.createElement('div');
        rank.className = 'leaderboard-rank';
        rank.textContent = `${index + 1}.`;

        const name = document.createElement('div');
        name.className = 'leaderboard-name';
        name.textContent = player.username || player.first_name || 'Аноним';

        const score = document.createElement('div');
        score.className = 'leaderboard-score';
        score.textContent = `${player.total_score} 🏆`;

        item.appendChild(rank);
        item.appendChild(name);
        item.appendChild(score);
        list.appendChild(item);
    });

    showScreen('leaderboard-screen');
}

function showAlreadyPlayedScreen(game) {
    const statsDiv = document.getElementById('today-stats');
    statsDiv.innerHTML = `
        <div class="today-stat-item">
            <span>Результат:</span>
            <span>${game.won ? '✅ Победа' : '❌ Поражение'}</span>
        </div>
        <div class="today-stat-item">
            <span>Попыток:</span>
            <span>${game.attempts}/6</span>
        </div>
        <div class="today-stat-item">
            <span>Очки:</span>
            <span>+${game.score}</span>
        </div>
    `;
    showScreen('already-played-screen');
}

function shareResult() {
    const attempts = currentRow + 1;
    const won = getCurrentGuess() === currentWord;

    let shareText = `🎮 Угадай слово\n\n`;
    shareText += won ? `Угадал за ${attempts}/6 попыток!\n` : `Не угадал 😔\n`;
    shareText += `\nСыграй и ты!`;

    tg.shareMessage(shareText);
}

// Event listeners
document.getElementById('stats-btn').addEventListener('click', showStats);
document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
document.getElementById('share-btn').addEventListener('click', shareResult);
document.getElementById('new-game-btn').addEventListener('click', () => {
    tg.close();
});
document.getElementById('back-from-stats').addEventListener('click', () => {
    showScreen('game-screen');
});
document.getElementById('back-from-leaderboard').addEventListener('click', () => {
    showScreen('game-screen');
});
document.getElementById('view-stats-btn').addEventListener('click', showStats);
document.getElementById('view-leaderboard-btn').addEventListener('click', showLeaderboard);

// Initialize
initGame();
