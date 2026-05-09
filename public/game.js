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
let todayGameData = null;

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
            todayGameData = playedData.game;
            showTodayResultInMenu();
        }

        // Show menu
        showScreen('menu-screen');

    } catch (error) {
        console.error('Init error:', error);
        tg.showAlert('Ошибка загрузки игры. Попробуйте позже.');
    }
}

function createBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    // Start with 6 rows, will add more dynamically
    for (let i = 0; i < 6; i++) {
        addNewRow(i);
    }
}

function addNewRow(rowIndex) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'board-row';
    row.id = `row-${rowIndex}`;

    for (let j = 0; j < 5; j++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = `tile-${rowIndex}-${j}`;
        row.appendChild(tile);
    }

    board.appendChild(row);
}

function setupKeyboard() {
    // Hide virtual keyboard
    const keyboard = document.querySelector('.keyboard');
    if (keyboard) {
        keyboard.style.display = 'none';
    }

    // Physical keyboard support only
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
    } else {
        // Next row - infinite attempts
        currentRow++;
        currentTile = 0;

        // Add new row if needed (every 6 rows)
        if (currentRow % 6 === 0) {
            for (let i = 0; i < 6; i++) {
                addNewRow(currentRow + i);
            }
        }

        // Scroll to current row
        const currentRowElement = document.getElementById(`row-${currentRow}`);
        if (currentRowElement) {
            currentRowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
    // Virtual keyboard is hidden, so this function does nothing now
    // Keeping it for compatibility
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

    // Bonus for fewer attempts (diminishing returns for more attempts)
    if (attempts <= 6) {
        score += (7 - attempts) * 20;
    } else if (attempts <= 10) {
        score += Math.max(0, (11 - attempts) * 10);
    } else {
        score += Math.max(0, 20 - attempts);
    }

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
    document.getElementById('result-attempts').textContent = `${attempts}`;

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

function showTodayResultInMenu() {
    const preview = document.getElementById('today-result-preview');
    const statsDiv = document.getElementById('today-preview-stats');

    if (todayGameData) {
        const minutes = Math.floor(todayGameData.time_taken / 60).toString().padStart(2, '0');
        const seconds = (todayGameData.time_taken % 60).toString().padStart(2, '0');

        statsDiv.innerHTML = `
            <div class="preview-stat-item">
                <span>Результат:</span>
                <span>${todayGameData.won ? '✅ Победа' : '❌ Поражение'}</span>
            </div>
            <div class="preview-stat-item">
                <span>Попыток:</span>
                <span>${todayGameData.attempts}</span>
            </div>
            <div class="preview-stat-item">
                <span>Время:</span>
                <span>${minutes}:${seconds}</span>
            </div>
            <div class="preview-stat-item">
                <span>Очки:</span>
                <span>+${todayGameData.score}</span>
            </div>
        `;
        preview.style.display = 'block';

        // Disable play button if already played
        const playBtn = document.getElementById('play-btn');
        playBtn.disabled = true;
        playBtn.textContent = '✅ Сыграно сегодня';
        playBtn.style.opacity = '0.6';
        playBtn.style.cursor = 'not-allowed';
    }
}

async function startGame() {
    if (todayGameData) {
        tg.showAlert('Вы уже играли сегодня! Возвращайтесь завтра за новым словом.');
        return;
    }

    try {
        // Get daily word
        const wordResponse = await fetch(`${API_URL}/api/daily-word`);
        const wordData = await wordResponse.json();
        currentWord = wordData.word.toUpperCase();

        console.log('Daily word:', currentWord); // For testing

        // Create game board
        createBoard();
        startTimer();
        setupKeyboard();

        showScreen('game-screen');

    } catch (error) {
        console.error('Error starting game:', error);
        tg.showAlert('Ошибка запуска игры. Попробуйте позже.');
    }
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
document.getElementById('play-btn').addEventListener('click', startGame);
document.getElementById('menu-stats-btn').addEventListener('click', showStats);
document.getElementById('menu-leaderboard-btn').addEventListener('click', showLeaderboard);
document.getElementById('stats-btn').addEventListener('click', showStats);
document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
document.getElementById('share-btn').addEventListener('click', shareResult);
document.getElementById('new-game-btn').addEventListener('click', () => {
    showScreen('menu-screen');
});
document.getElementById('back-from-stats').addEventListener('click', () => {
    showScreen('menu-screen');
});
document.getElementById('back-from-leaderboard').addEventListener('click', () => {
    showScreen('menu-screen');
});

// Initialize
initGame();
