
const maxMapSize = 8192;

const locationsData = [
    { img: 'images/1702x3430.png', x: 1702, y: 3430 },
    { img: 'images/1911x3527.png', x: 1911, y: 3527 },
    { img: 'images/2100x3695.png', x: 2100, y: 3695 },
    { img: 'images/2765x3853.png', x: 2765, y: 3853 },
    { img: 'images/3430x4044.png', x: 3430, y: 4044 },
    { img: 'images/3447x3843.png', x: 3447, y: 3843 },
    { img: 'images/5693x4858.png', x: 5693, y: 4858 },
    { img: 'images/3960x3860.png', x: 3960, y: 3860 },
    { img: 'images/5515x4888.png', x: 5515, y: 4888 }
];

// состояние игры
let currentRound = 0;
let totalScore = 0;
let currentGuess = null;

// dom элементы
const sceneImage = document.getElementById('scene-image');
const minimap = document.getElementById('minimap');
const mapContainer = document.getElementById('map-container');
const marker = document.getElementById('marker');
const guessBtn = document.getElementById('guess-btn');
const scoreDisplay = document.getElementById('score');
const roundDisplay = document.getElementById('round');

// инициализация игры
function initGame() {
    currentRound = 0;
    totalScore = 0;
    scoreDisplay.textContent = totalScore;
    loadRound();
}

// загрузка нового раунда
function loadRound() {
    if (currentRound >= locationsData.length) {
        alert(`игра окончена! твой итоговый счет: ${totalScore}`);
        initGame();
        return;
    }

    const location = locationsData[currentRound];
    sceneImage.src = location.img;

    // сброс ui
    marker.classList.add('hidden');
    currentGuess = null;
    guessBtn.disabled = true;
    roundDisplay.textContent = currentRound + 1;
}

// обработка клика по карте
mapContainer.addEventListener('click', (e) => {
    const rect = mapContainer.getBoundingClientRect();

    // вычисляем координаты клика относительно контейнера карты
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // переводим в проценты
    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    currentGuess = { x: percentX, y: percentY };

    // отображаем маркер
    marker.style.left = `${percentX}%`;
    marker.style.top = `${percentY}%`;
    marker.classList.remove('hidden');

    // активируем кнопку
    guessBtn.disabled = false;
});

// расчет очков
function calculateScore(guessX, guessY, actualX, actualY) {
    // сначала переводим абсолютные координаты локации в проценты
    const actualPercentX = (actualX / maxMapSize) * 100;
    const actualPercentY = (actualY / maxMapSize) * 100;

    // теперь применяем теорему пифагора к двум процентным значениям
    const dx = guessX - actualPercentX;
    const dy = guessY - actualPercentY;
    const distance = Math.sqrt(dx * dx + dy * dy);


    let score = 5000 - (distance * 100);

    if (score < 0) score = 0;
    return Math.round(score);
}

// обработка кнопки "угадать"
guessBtn.addEventListener('click', () => {
    if (!currentGuess) return;

    const actualLocation = locationsData[currentRound];
    const roundScore = calculateScore(currentGuess.x, currentGuess.y, actualLocation.x, actualLocation.y);

    totalScore += roundScore;
    scoreDisplay.textContent = totalScore;

    alert(`ты заработал ${roundScore} очков в этом раунде!`);

    currentRound++;
    loadRound();
});


initGame();