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
let elapsedBeforePause = 0;
let todayGameData = null;
let keyboardInitialized = false;

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
        await fetch(`${API_URL}/api/user/${user.id}`);

        // Update UI
        document.getElementById('username').textContent = user.first_name || user.username || 'Игрок';

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

    if (keyboardInitialized) {
        return;
    }

    document.addEventListener('keydown', handlePhysicalKeyDown);
    document.getElementById('game-board').addEventListener('click', focusMobileInput);
    document.getElementById('mobile-input').addEventListener('input', handleMobileInput);
    keyboardInitialized = true;
}

function handlePhysicalKeyDown(e) {
    if (gameOver || e.repeat || !isGameScreenActive()) return;
    const isMobileInput = e.target?.id === 'mobile-input';

    if (isMobileInput && /^[а-яА-ЯёЁ]$/.test(e.key)) {
        return;
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyPress('Enter');
    } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('Backspace');
    } else if (/^[а-яА-ЯёЁ]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
    }
}

function isGameScreenActive() {
    return document.getElementById('game-screen').classList.contains('active');
}

function focusMobileInput() {
    if (gameOver || !isGameScreenActive()) return;

    const input = document.getElementById('mobile-input');
    input.value = '';

    try {
        input.focus({ preventScroll: true });
    } catch (error) {
        input.focus();
    }
}

function handleMobileInput(e) {
    if (gameOver || !isGameScreenActive()) {
        e.target.value = '';
        return;
    }

    const letters = [...e.target.value].filter(letter => /^[а-яА-ЯёЁ]$/.test(letter));
    letters.forEach(letter => handleKeyPress(letter.toUpperCase()));
    e.target.value = '';
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
        pauseTimer();
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
    startTime = Date.now() - elapsedBeforePause;
    updateTimerDisplay();

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function pauseTimer() {
    if (!timerInterval) return;

    elapsedBeforePause = Date.now() - startTime;
    stopTimer();
    updateTimerDisplay();
}

function getElapsedSeconds() {
    const elapsedMs = timerInterval ? Date.now() - startTime : elapsedBeforePause;
    return Math.floor(elapsedMs / 1000);
}

function updateTimerDisplay() {
    const elapsed = getElapsedSeconds();
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
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
    const timeTaken = getElapsedSeconds();
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
        todayGameData = {
            word: currentWord,
            attempts: attempts,
            won: won ? 1 : 0,
            score: score,
            time_taken: timeTaken
        };
        showTodayResultInMenu();
    } catch (error) {
        console.error('Error saving game:', error);
    }

    renderResult({
        word: currentWord,
        attempts,
        won,
        score,
        time_taken: timeTaken
    });
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

function showTodayResultInMenu() {
    if (todayGameData) {
        updateMenuPlayButton();
    }
}

async function startGame() {
    if (todayGameData) {
        showStoredTodayResult();
        return;
    }

    if (currentWord && !gameOver) {
        startTimer();
        setupKeyboard();
        showScreen('game-screen');
        focusMobileInput();
        return;
    }

    try {
        // Get daily word
        const wordResponse = await fetch(`${API_URL}/api/daily-word`);
        const wordData = await wordResponse.json();
        currentWord = wordData.word.toUpperCase();
        currentRow = 0;
        currentTile = 0;
        gameOver = false;
        elapsedBeforePause = 0;

        // Create game board
        createBoard();
        startTimer();
        setupKeyboard();

        showScreen('game-screen');
        focusMobileInput();

    } catch (error) {
        console.error('Error starting game:', error);
        tg.showAlert('Ошибка запуска игры. Попробуйте позже.');
    }
}

function updateMenuPlayButton() {
    const playBtn = document.getElementById('play-btn');

    playBtn.disabled = false;
    playBtn.style.opacity = '1';
    playBtn.style.cursor = 'pointer';

    if (todayGameData) {
        playBtn.textContent = '📋 Посмотреть результат';
    } else if (currentWord && !gameOver) {
        playBtn.textContent = '▶️ Продолжить';
    } else {
        playBtn.textContent = '🎮 Играть';
    }
}

function returnToMenuFromGame() {
    if (!gameOver && currentWord) {
        pauseTimer();
    }

    document.getElementById('mobile-input').blur();
    updateMenuPlayButton();
    showScreen('menu-screen');
}

function renderResult(game) {
    const won = Boolean(game.won);
    const timeTaken = Number(game.time_taken) || 0;
    const score = Number(game.score) || 0;
    const attempts = Number(game.attempts) || 0;

    document.getElementById('result-title').textContent = won ? '🎉 Победа!' : '😔 Не угадали';
    document.getElementById('result-word').textContent = game.word || currentWord;
    document.getElementById('result-attempts').textContent = `${attempts}`;

    const minutes = Math.floor(timeTaken / 60).toString().padStart(2, '0');
    const seconds = (timeTaken % 60).toString().padStart(2, '0');
    document.getElementById('result-time').textContent = `${minutes}:${seconds}`;
    document.getElementById('result-score').textContent = won ? `+${score}` : '0';
    document.getElementById('result-message').textContent = 'Приходи завтра!';

    showScreen('result-screen');
}

function showStoredTodayResult() {
    if (!todayGameData) return;

    renderResult(todayGameData);
}

// Event listeners
document.getElementById('play-btn').addEventListener('click', startGame);
document.getElementById('menu-stats-btn').addEventListener('click', showStats);
document.getElementById('menu-leaderboard-btn').addEventListener('click', showLeaderboard);
document.getElementById('stats-btn').addEventListener('click', showStats);
document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
document.getElementById('back-to-menu-btn').addEventListener('click', returnToMenuFromGame);
document.getElementById('new-game-btn').addEventListener('click', () => {
    showScreen('menu-screen');
    updateMenuPlayButton();
});
document.getElementById('back-from-stats').addEventListener('click', () => {
    updateMenuPlayButton();
    showScreen('menu-screen');
});
document.getElementById('back-from-leaderboard').addEventListener('click', () => {
    updateMenuPlayButton();
    showScreen('menu-screen');
});

// Initialize
initGame();
