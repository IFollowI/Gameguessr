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

// функция для масштабирования карты колесиком мыши с учетом позиции курсора
mapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // получаем позицию курсора относительно карты
    const rect = mapContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // вычисляем процентное положение курсора (0-100)
    const originX = (mouseX / rect.width) * 100;
    const originY = (mouseY / rect.height) * 100;
    
    // сохраняем старый масштаб
    const oldScale = mapScale;
    
    // определяем направление прокрутки
    if (e.deltaY < 0) {
        // прокрутка вверх - увеличиваем
        mapScale = Math.min(maxScale, mapScale + scaleStep);
    } else {
        // прокрутка вниз - уменьшаем
        mapScale = Math.max(minScale, mapScale - scaleStep);
    }
    
    // применяем трансформацию с учетом точки origin
    mapContainer.style.transformOrigin = `${originX}% ${originY}%`;
    mapContainer.style.transform = `scale(${mapScale})`;
    mapContainer.style.transition = 'transform 0.1s ease';
    
    // динамически меняем max-width в зависимости от масштаба
    const baseWidth = 320; // базовая ширина
    mapContainer.style.maxWidth = `${baseWidth * mapScale}px`;
});

// сбрасываем масштаб при уходе курсора с карты
mapContainer.addEventListener('mouseleave', () => {
    mapScale = 1;
    mapContainer.style.transform = 'scale(1)';
    mapContainer.style.transformOrigin = 'center center';
    mapContainer.style.maxWidth = '320px';
    mapContainer.style.transition = 'transform 0.3s ease, max-width 0.3s ease';
});

// отслеживаем движение мыши для динамического обновления точки трансформации
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

// функция для расчета расстояния в метрах на карте
function calculateDistanceInMeters(guessX, guessY, targetX, targetY) {
    // конвертируем проценты обратно в координаты карты
    const guessMapX = (guessX / 100) * maxMapSize;
    const guessMapY = (guessY / 100) * maxMapSize;
    const targetMapX = (targetX / 100) * maxMapSize;
    const targetMapY = (targetY / 100) * maxMapSize;
    
    // рассчитываем расстояние в единицах карты
    const dx = guessMapX - targetMapX;
    const dy = guessMapY - targetMapY;
    const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy);
    
    // конвертируем в метры (примерный масштаб: 1 единица карты = 0.5 метра)
    // вы можете настроить этот коэффициент под свою карту
    const metersPerUnit = 0.5;
    const distanceInMeters = distanceInMapUnits * metersPerUnit;
    
    return Math.round(distanceInMeters);
}

// функция для отображения линии и расстояния между догадкой и правильным ответом
function showConnectionLine(guessX, guessY, targetX, targetY) {
    // отображаем линию
    connectionLine.setAttribute('x1', `${guessX}%`);
    connectionLine.setAttribute('y1', `${guessY}%`);
    connectionLine.setAttribute('x2', `${targetX}%`);
    connectionLine.setAttribute('y2', `${targetY}%`);
    connectionLine.style.display = 'block';
    
    // рассчитываем и отображаем расстояние
    const distance = calculateDistanceInMeters(guessX, guessY, targetX, targetY);
    
    // размещаем текст посередине линии
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

// функция для отображения целевой точки (правильного ответа)
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

    // скрываем целевую точку, линию и текст
    hideTargetLocation();
    hideConnectionLine();
    
    // сброс ui (маркер догадки)
    marker.classList.add('hidden');
    currentGuess = null;
    guessBtn.disabled = true;
    roundDisplay.textContent = currentRound + 1;
}

// обработка клика по карте
mapContainer.addEventListener('click', (e) => {
    const rect = mapContainer.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    currentGuess = { x: percentX, y: percentY };

    marker.style.left = `${percentX}%`;
    marker.style.top = `${percentY}%`;
    marker.classList.remove('hidden');

    guessBtn.disabled = false;
});

// расчет очков
function calculateScore(guessX, guessY, actualX, actualY) {
    const actualPercentX = (actualX / maxMapSize) * 100;
    const actualPercentY = (actualY / maxMapSize) * 100;

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

    const actualPercentX = (actualLocation.x / maxMapSize) * 100;
    const actualPercentY = (actualLocation.y / maxMapSize) * 100;

    // ПОКАЗЫВАЕМ ПРАВИЛЬНЫЙ ОТВЕТ (красная точка)
    showTargetLocation();
    
    // ПОКАЗЫВАЕМ ЛИНИЮ И РАССТОЯНИЕ
    showConnectionLine(currentGuess.x, currentGuess.y, actualPercentX, actualPercentY);

    const distance = calculateDistanceInMeters(currentGuess.x, currentGuess.y, actualPercentX, actualPercentY);
    alert(`ты заработал ${roundScore} очков в этом раунде!`);

    // задержка перед следующим раундом
    setTimeout(() => {
        currentRound++;
        loadRound();
    }, 3000); // 3 секунды показываем результат
});

initGame();
