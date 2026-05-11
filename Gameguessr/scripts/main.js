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

// переменные для масштабирования карты
let mapScale = 1;
const minScale = 0.5;
const maxScale = 3;
const scaleStep = 0.1;

// dom элементы
const sceneImage = document.getElementById('scene-image');
const minimap = document.getElementById('minimap');
const mapContainer = document.getElementById('map-container');
const marker = document.getElementById('marker');
const targetMarker = document.getElementById('target-marker');
const guessBtn = document.getElementById('guess-btn');
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

// функция для масштабирования мини-карты колесиком мыши
mapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = mapContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const originX = (mouseX / rect.width) * 100;
    const originY = (mouseY / rect.height) * 100;
    
    const oldScale = mapScale;
    
    if (e.deltaY < 0) {
        mapScale = Math.min(maxScale, mapScale + scaleStep);
    } else {
        mapScale = Math.max(minScale, mapScale - scaleStep);
    }
    
    mapContainer.style.transformOrigin = `${originX}% ${originY}%`;
    mapContainer.style.transform = `scale(${mapScale})`;
    mapContainer.style.transition = 'transform 0.1s ease';
    
    const baseWidth = 320;
    mapContainer.style.maxWidth = `${baseWidth * mapScale}px`;
});

// сбрасываем масштаб при уходе курсора
mapContainer.addEventListener('mouseleave', () => {
    mapScale = 1;
    mapContainer.style.transform = 'scale(1)';
    mapContainer.style.transformOrigin = 'center center';
    mapContainer.style.maxWidth = '320px';
    mapContainer.style.transition = 'transform 0.3s ease, max-width 0.3s ease';
});

// отслеживаем движение мыши
mapContainer.addEventListener('mousemove', (e) => {
    if (mapScale !== 1) {
        const rect = mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const originX = (mouseX / rect.width) * 100;
        const originY = (mouseY / rect.height) * 100;
        
        mapContainer.style.transformOrigin = `${originX}% ${originY}%`;
    }
});

// ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ПРИ КЛИКЕ НА МИНИ-КАРТУ
mapContainer.addEventListener('click', (e) => {
    // Проверяем, не был ли клик на маркере или других элементах
    if (e.target === mapContainer || e.target === minimap) {
        modal.classList.remove('hidden');
        modalGuess = null;
        modalMarker.classList.add('hidden');
        confirmLocationBtn.disabled = true;
        modalCoordinates.textContent = 'X: 0, Y: 0';
    }
});

// ОБРАБОТКА КЛИКА В МОДАЛЬНОМ ОКНЕ (система координат 4096x4096)
modalMapContainer.addEventListener('click', (e) => {
    const rect = modalMapContainer.getBoundingClientRect();
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Конвертируем в координаты 4096x4096
    const coordX = Math.round((clickX / rect.width) * modalMapSize);
    const coordY = Math.round((clickY / rect.height) * modalMapSize);
    
    // Процентное соотношение для отображения маркера
    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;
    
    modalGuess = { 
        x: coordX, 
        y: coordY,
        percentX: percentX,
        percentY: percentY
    };
    
    // Показываем маркер в модальном окне
    modalMarker.style.left = `${percentX}%`;
    modalMarker.style.top = `${percentY}%`;
    modalMarker.classList.remove('hidden');
    
    // Показываем координаты
    modalCoordinates.textContent = `X: ${coordX}, Y: ${coordY}`;
    
    confirmLocationBtn.disabled = false;
});

// ОТСЛЕЖИВАНИЕ ДВИЖЕНИЯ МЫШИ В МОДАЛЬНОМ ОКНЕ ДЛЯ ОТОБРАЖЕНИЯ КООРДИНАТ
modalMapContainer.addEventListener('mousemove', (e) => {
    if (!modalGuess) {
        const rect = modalMapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const coordX = Math.round((mouseX / rect.width) * modalMapSize);
        const coordY = Math.round((mouseY / rect.height) * modalMapSize);
        
        modalCoordinates.textContent = `X: ${coordX}, Y: ${coordY}`;
    }
});

// ПОДТВЕРЖДЕНИЕ ВЫБОРА В МОДАЛЬНОМ ОКНЕ
confirmLocationBtn.addEventListener('click', () => {
    if (!modalGuess) return;
    
    // Конвертируем координаты из 4096 в 8192 для мини-карты
    const convertedX = (modalGuess.x / modalMapSize) * maxMapSize;
    const convertedY = (modalGuess.y / modalMapSize) * maxMapSize;
    
    // Проценты для мини-карты
    const percentX = (convertedX / maxMapSize) * 100;
    const percentY = (convertedY / maxMapSize) * 100;
    
    currentGuess = { 
        x: percentX, 
        y: percentY,
        coordX: modalGuess.x, // Сохраняем оригинальные координаты из модального окна
        coordY: modalGuess.y
    };
    
    // Обновляем маркер на мини-карте
    marker.style.left = `${percentX}%`;
    marker.style.top = `${percentY}%`;
    marker.classList.remove('hidden');
    
    guessBtn.disabled = false;
    
    // Закрываем модальное окно
    modal.classList.add('hidden');
});

// ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Закрытие модального окна при клике вне его содержимого
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
    }
});

// ФУНКЦИЯ РАСЧЕТА РЕАЛЬНОГО РАССТОЯНИЯ В МЕТРАХ
function calculateRealDistance(guessMapX, guessMapY, targetMapX, targetMapY) {
    // Рассчитываем разницу в единицах карты
    const dx = guessMapX - targetMapX;
    const dy = guessMapY - targetMapY;
    const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy);
    
    // Конвертируем единицы карты в реальные метры
    // Так как карта 8192x8192 единиц соответствует реальным 8192x8192 метрам
    const metersPerUnit = mapRealWidthMeters / maxMapSize; // 1 единица = 1 метр
    const distanceInMeters = distanceInMapUnits * metersPerUnit;
    
    return Math.round(distanceInMeters);
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
    const guessMapX = (guessX / 100) * maxMapSize;
    const guessMapY = (guessY / 100) * maxMapSize;
    const targetMapX = (targetX / 100) * maxMapSize;
    const targetMapY = (targetY / 100) * maxMapSize;
    
    const distance = calculateRealDistance(guessMapX, guessMapY, targetMapX, targetMapY);
    
    const midX = (guessX + targetX) / 2;
    const midY = (guessY + targetY) / 2;
    
    distanceText.setAttribute('x', `${midX}%`);
    distanceText.setAttribute('y', `${midY}%`);
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
    const location = locationsData[currentRound];
    const actualPercentX = (location.x / maxMapSize) * 100;
    const actualPercentY = (location.y / maxMapSize) * 100;
    
    targetMarker.style.left = `${actualPercentX}%`;
    targetMarker.style.top = `${actualPercentY}%`;
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

    const location = locationsData[currentRound];
    sceneImage.src = location.img;

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
    const guessMapX = (currentGuess.x / 100) * maxMapSize;
    const guessMapY = (currentGuess.y / 100) * maxMapSize;
    const targetMapX = actualLocation.x;
    const targetMapY = actualLocation.y;
    
    // Рассчитываем реальное расстояние в метрах
    const distanceInMeters = calculateRealDistance(guessMapX, guessMapY, targetMapX, targetMapY);
    
    // Рассчитываем очки на основе расстояния
    const roundScore = calculateScore(distanceInMeters);

    totalScore += roundScore;
    scoreDisplay.textContent = totalScore;

    const actualPercentX = (actualLocation.x / maxMapSize) * 100;
    const actualPercentY = (actualLocation.y / maxMapSize) * 100;

    showTargetLocation();
    showConnectionLine(currentGuess.x, currentGuess.y, actualPercentX, actualPercentY);

    alert(`Расстояние: ${distanceInMeters}м\nТы заработал ${roundScore} очков в этом раунде!`);

    setTimeout(() => {
        currentRound++;
        loadRound();
    }, 3000);
});

initGame();
