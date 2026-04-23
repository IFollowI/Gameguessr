// укажи здесь реальный размер твоей картинки карты (или масштаб координат)
// для эрангеля обычно используется сетка 8192x8192
const maxMapSize = 8192;

const locationsData = [
    { img: 'images/loc1.jpg', x: 3610, y: 4100 },
    { img: 'images/loc2.jpg', x: 3340, y: 1665 },
    { img: 'images/loc3.jpg', x: 7253, y: 3322 },
    { img: 'images/loc4.jpg', x: 3891, y: 1114 },
    { img: 'images/loc5.jpg', x: 5543, y: 2414 }
];

// состояние игры
let currentRound = 0;
let totalScore = 0;
let currentGuess = null; // {x, y} в процентах

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

    // чем меньше дистанция, тем больше очков
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

// запуск
initGame();