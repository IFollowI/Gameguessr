const maxMapSize = 8192;
const modalMapSize = 4096; // Размер карты в модальном окне
const mapRealWidthMeters = 8192; // Реальная ширина карты в метрах
const mapRealHeightMeters = 8192; // Реальная высота карты в метрах

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
const mapContainer = document.getElementById('map-container');
const marker = document.getElementById('marker');
const targetMarker = document.getElementById('target-marker');
const guessBtn = document.getElementById('guess-btn');
const openBigMapBtn = document.getElementById('open-big-map');
const scoreDisplay = document.getElementById('score');
const roundDisplay = document.getElementById('round');

// модальное окно
const modal = document.getElementById('map-modal');
const modalMapContainer = document.getElementById('modal-map-container');
const modalMarker = document.getElementById('modal-marker');
const modalCoordinates = document.getElementById('modal-coordinates');
const closeModalBtn = document.getElementById('close-modal');
const confirmLocationBtn = document.getElementById('confirm-location');
let modalGuess = null; // Координаты в системе 4096x4096

const modalMapWrapper = document.querySelector('.modal-map-wrapper');
let modalMapScale = 1;
const modalMapMaxScale = 4;
const modalMapScaleStep = 0.12;

// создаем SVG элемент для линии и текста расстояния
const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svgOverlay.classList.add('connection-line');
svgOverlay.innerHTML = `
    <line id="connection-line" x1="0" y1="0" x2="0" y2="0" 
          stroke="#ff0000" stroke-width="2" stroke-dasharray="5,3" 
          opacity="0.9" style="display: none;" />
    <text id="distance-text" class="distance-label" x="0" y="0" 
          style="display: none;">0m</text>
`;
mapContainer.appendChild(svgOverlay);

const connectionLine = document.getElementById('connection-line');
const distanceText = document.getElementById('distance-text');

function setGuessFromMinimapEvent(e) {
    const r = mapContainer.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    const percentX = nx * 100, percentY = ny * 100;
    currentGuess = { x: percentX, y: percentY, coordX: Math.round(nx * maxMapSize), coordY: Math.round(ny * maxMapSize) };
    marker.style.left = `${percentX}%`;
    marker.style.top = `${percentY}%`;
    marker.classList.remove('hidden');
    guessBtn.disabled = false;
}

// Угадывание по клику левой кнопкой по мини-карте (без модального окна)
mapContainer.addEventListener('click', (e) => {
    if (e.button > 0) return;
    setGuessFromMinimapEvent(e);
});

function modalPointerNorm(e) {
    const r = modalMapContainer.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    return { nx, ny };
}

function resetModalMapZoom() {
    modalMapScale = 1;
    modalMapContainer.style.transform = '';
    modalMapContainer.style.transformOrigin = 'center center';
    modalMapWrapper?.scrollTo(0, 0);
}

function openMapModal() {
    resetModalMapZoom();
    modal.classList.remove('hidden');
    modalGuess = null;
    modalMarker.classList.add('hidden');
    confirmLocationBtn.disabled = true;
    modalCoordinates.textContent = 'X: 0, Y: 0';
    requestAnimationFrame(() => { modal.scrollTop = 0; });
}

function closeMapModal() {
    modal.classList.add('hidden');
    resetModalMapZoom();
}

// Всплывающая карта — отдельная кнопка (левая кнопка мыши)
openBigMapBtn.addEventListener('click', openMapModal);

// Масштаб всплывающей карты колесиком мыши
modalMapContainer.addEventListener(
    'wheel',
    (e) => {
        if (modal.classList.contains('hidden')) return;
        e.preventDefault();
        e.stopPropagation();
        const { nx, ny } = modalPointerNorm(e);
        modalMapContainer.style.transformOrigin = `${nx * 100}% ${ny * 100}%`;
        const d = e.deltaY < 0 ? modalMapScaleStep : -modalMapScaleStep;
        modalMapScale = Math.min(modalMapMaxScale, Math.max(1, modalMapScale + d));
        modalMapContainer.style.transform = `scale(${modalMapScale})`;
    },
    { passive: false }
);

// ОБРАБОТКА КЛИКА ЛЕВОЙ КНОПКОЙ В МОДАЛЬНОМ ОКНЕ (система координат 4096x4096)
modalMapContainer.addEventListener('click', (e) => {
    if (e.button > 0) return;
    const { nx, ny } = modalPointerNorm(e);
    // Конвертируем в координаты 4096x4096
    const coordX = Math.round(nx * modalMapSize), coordY = Math.round(ny * modalMapSize);
    // Процентное соотношение для отображения маркера
    const percentX = nx * 100, percentY = ny * 100;
    modalGuess = { x: coordX, y: coordY, percentX, percentY };
    // Показываем маркер в модальном окне
    modalMarker.style.left = `${percentX}%`;
    modalMarker.style.top = `${percentY}%`;
    modalMarker.classList.remove('hidden');
    // Показываем координаты
    modalCoordinates.textContent = `X: ${coordX}, Y: ${coordY}`;
    confirmLocationBtn.disabled = false;
});

// Движение мыши: точка масштаба + координаты
modalMapContainer.addEventListener('mousemove', (e) => {
    const { nx, ny } = modalPointerNorm(e);
    if (modalMapScale !== 1) modalMapContainer.style.transformOrigin = `${nx * 100}% ${ny * 100}%`;
    if (!modalGuess) {
        modalCoordinates.textContent = `X: ${Math.round(nx * modalMapSize)}, Y: ${Math.round(ny * modalMapSize)}`;
    }
});

// ПОДТВЕРЖДЕНИЕ ВЫБОРА В МОДАЛЬНОМ ОКНЕ
confirmLocationBtn.addEventListener('click', () => {
    if (!modalGuess) return;
    // Конвертируем координаты из 4096 в 8192 для мини-карты
    const convertedX = (modalGuess.x / modalMapSize) * maxMapSize, convertedY = (modalGuess.y / modalMapSize) * maxMapSize;
    // Проценты для мини-карты
    const percentX = (convertedX / maxMapSize) * 100, percentY = (convertedY / maxMapSize) * 100;
    currentGuess = { x: percentX, y: percentY, coordX: modalGuess.x, coordY: modalGuess.y }; // Сохраняем оригинальные координаты из модального окна
    // Обновляем маркер на мини-карте
    marker.style.left = `${percentX}%`;
    marker.style.top = `${percentY}%`;
    marker.classList.remove('hidden');
    guessBtn.disabled = false;
    // Закрываем модальное окно
    closeMapModal();
});

// ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
closeModalBtn.addEventListener('click', closeMapModal);

// Закрытие модального окна при клике вне его содержимого
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeMapModal();
});

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeMapModal();
});

// ФУНКЦИЯ РАСЧЕТА РЕАЛЬНОГО РАССТОЯНИЯ В МЕТРАХ
function calculateRealDistance(guessMapX, guessMapY, targetMapX, targetMapY) {
    // Рассчитываем разницу в единицах карты
    const dx = guessMapX - targetMapX, dy = guessMapY - targetMapY;
    const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy);
    // Конвертируем единицы карты в реальные метры
    // Так как карта 8192x8192 единиц соответствует реальным 8192x8192 метрам
    const metersPerUnit = mapRealWidthMeters / maxMapSize; // 1 единица = 1 метр
    return Math.round(distanceInMapUnits * metersPerUnit);
}

// НОВАЯ ФУНКЦИЯ РАСЧЕТА ОЧКОВ
function calculateScore(distanceInMeters) {
    const maxScore = 5000;
    // Если расстояние 0 метров - максимум очков
    if (distanceInMeters === 0) return maxScore;
    // Если расстояние 4000 метров - 1000 очков (как в примере)
    // Если расстояние 0 метров - 5000 очков
    // Используем линейную формулу: score = 5000 - (distance * 1)
    // Проверяем: при distance = 4000, score = 5000 - 4000 = 1000 ✓
    let score = maxScore - distanceInMeters;
    // Очки не могут быть отрицательными
    if (score < 0) score = 0;
    return Math.round(score);
}

// функция для отображения линии и расстояния
function showConnectionLine(guessX, guessY, targetX, targetY) {
    connectionLine.setAttribute('x1', `${guessX}%`);
    connectionLine.setAttribute('y1', `${guessY}%`);
    connectionLine.setAttribute('x2', `${targetX}%`);
    connectionLine.setAttribute('y2', `${targetY}%`);
    connectionLine.style.display = 'block';
    // Конвертируем проценты в координаты карты для расчета реального расстояния
    const guessMapX = (guessX / 100) * maxMapSize, guessMapY = (guessY / 100) * maxMapSize;
    const targetMapX = (targetX / 100) * maxMapSize, targetMapY = (targetY / 100) * maxMapSize;
    const distance = calculateRealDistance(guessMapX, guessMapY, targetMapX, targetMapY);
    distanceText.setAttribute('x', `${(guessX + targetX) / 2}%`);
    distanceText.setAttribute('y', `${(guessY + targetY) / 2}%`);
    distanceText.textContent = `${distance}m`;
    distanceText.style.display = 'block';
}

// функция для скрытия линии и текста
function hideConnectionLine() {
    connectionLine.style.display = 'none';
    distanceText.style.display = 'none';
}

// функция для отображения целевой точки
function showTargetLocation() {
    const { x, y } = locationsData[currentRound];
    targetMarker.style.left = `${(x / maxMapSize) * 100}%`;
    targetMarker.style.top = `${(y / maxMapSize) * 100}%`;
    targetMarker.classList.remove('hidden');
}

// функция для скрытия целевой точки
function hideTargetLocation() {
    targetMarker.classList.add('hidden');
}

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
    sceneImage.src = locationsData[currentRound].img;
    hideTargetLocation();
    hideConnectionLine();
    marker.classList.add('hidden');
    currentGuess = null;
    guessBtn.disabled = true;
    roundDisplay.textContent = currentRound + 1;
}

// обработка кнопки "угадать"
guessBtn.addEventListener('click', () => {
    if (!currentGuess) return;
    const actualLocation = locationsData[currentRound];
    // Конвертируем проценты в координаты карты для расчета реального расстояния
    const guessMapX = (currentGuess.x / 100) * maxMapSize, guessMapY = (currentGuess.y / 100) * maxMapSize;
    // Рассчитываем реальное расстояние в метрах
    const distanceInMeters = calculateRealDistance(guessMapX, guessMapY, actualLocation.x, actualLocation.y);
    // Рассчитываем очки на основе расстояния
    const roundScore = calculateScore(distanceInMeters);
    totalScore += roundScore;
    scoreDisplay.textContent = totalScore;
    const actualPercentX = (actualLocation.x / maxMapSize) * 100, actualPercentY = (actualLocation.y / maxMapSize) * 100;
    showTargetLocation();
    showConnectionLine(currentGuess.x, currentGuess.y, actualPercentX, actualPercentY);
    alert(`Расстояние: ${distanceInMeters}м\nТы заработал ${roundScore} очков в этом раунде!`);
    setTimeout(() => { currentRound++; loadRound(); }, 3000);
});

initGame();
