// Основное приложение

let deckManager;
let currentDeck = null;
let currentCardIndex = 0;
let isCardFlipped = false;
let startX = 0;
let currentX = 0;

// Инициализация Telegram WebApp
function initTelegramWebApp() {
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Устанавливаем тему из Telegram
        const theme = tg.colorScheme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        
        // Слушаем изменения темы
        tg.onEvent('themeChanged', () => {
            document.documentElement.setAttribute('data-theme', tg.colorScheme);
        });
    } else {
        // Для тестирования вне Telegram - используем светлую тему по умолчанию
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// Очистка кэша при обновлении версии
const APP_VERSION = '2.1';
const VERSION_KEY = 'app_version';

function clearCacheIfNeeded() {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    if (savedVersion !== APP_VERSION) {
        // Очищаем кэш браузера для статических файлов
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        // Очищаем localStorage для колод (они будут перезагружены)
        localStorage.removeItem('saved_decks');
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        // Принудительная перезагрузка страницы при первом запуске новой версии
        if (savedVersion && savedVersion !== APP_VERSION) {
            window.location.reload(true);
        }
    }
}

// Инициализация приложения
function initApp() {
    clearCacheIfNeeded();
    initTelegramWebApp();
    deckManager = new DeckManager();
    showDeckList();
    renderDecks();
    
    // Обработчики навигации
    document.getElementById('back-button').addEventListener('click', showDeckList);
    document.getElementById('edit-button').addEventListener('click', () => {
        // TODO: Реализовать редактирование колоды
        alert('Редактирование колоды будет добавлено позже');
    });
    
    // Обработчики карт
    document.getElementById('random-button').addEventListener('click', showRandomCard);
    document.getElementById('prev-button').addEventListener('click', showPreviousCard);
    document.getElementById('next-button').addEventListener('click', showNextCard);
    document.getElementById('flip-button').addEventListener('click', flipCard);
    
    // Обработчик свайпов
    setupSwipeHandlers();
}

// Показать список колод
function showDeckList() {
    document.getElementById('deck-list-screen').classList.add('active');
    document.getElementById('card-viewer-screen').classList.remove('active');
    document.getElementById('edit-deck-screen').classList.remove('active');
    renderDecks();
}

// Отобразить колоды
function renderDecks() {
    const grid = document.getElementById('decks-grid');
    grid.innerHTML = '';
    
    deckManager.decks.forEach(deck => {
        const card = createDeckCard(deck);
        grid.appendChild(card);
    });
    
    // Кнопка добавления колоды
    const addCard = createAddDeckCard();
    grid.appendChild(addCard);
}

// Создать карточку колоды
function createDeckCard(deck) {
    const card = document.createElement('div');
    card.className = 'deck-card';
    card.innerHTML = `
        <div class="deck-emoji">${deck.emoji}</div>
        <div class="deck-name">${deck.name}</div>
        ${deck.ageRating ? `<div class="age-rating">${deck.ageRating}</div>` : ''}
        <div class="deck-card-count">${deck.cardCount} вопросов</div>
    `;
    
    card.addEventListener('click', () => {
        openDeck(deck.id);
    });
    
    return card;
}

// Создать кнопку добавления колоды
function createAddDeckCard() {
    const card = document.createElement('div');
    card.className = 'add-deck-card';
    card.innerHTML = `
        <div class="add-deck-icon">+</div>
        <div class="add-deck-text">Добавить свой свиток</div>
        <div class="add-deck-quote">«Каждый вопрос рождает мир»</div>
    `;
    
    card.addEventListener('click', () => {
        // TODO: Реализовать добавление колоды
        alert('Добавление колоды будет добавлено позже');
    });
    
    return card;
}

// Открыть колоду
function openDeck(deckId) {
    const deck = deckManager.getDeckById(deckId);
    if (!deck) return;
    
    currentDeck = deck;
    currentCardIndex = 0;
    isCardFlipped = false;
    
    document.getElementById('deck-list-screen').classList.remove('active');
    document.getElementById('card-viewer-screen').classList.add('active');
    
    updateCardViewer();
}

// Обновить просмотрщик карт
function updateCardViewer() {
    if (!currentDeck || currentDeck.cards.length === 0) {
        // Показать сообщение об empty колоде
        return;
    }
    
    const card = currentDeck.cards[currentCardIndex];
    document.getElementById('deck-name-header').textContent = currentDeck.name;
    document.getElementById('card-counter').textContent = 
        `Карта ${currentCardIndex + 1} из ${currentDeck.cards.length}`;
    
    document.getElementById('main-question').textContent = card.mainQuestion;
    // Для колоды "Большая семья" не показываем дополнительный вопрос
    if (currentDeck.name === 'Большая семья') {
        document.getElementById('additional-question').textContent = '';
    } else {
        document.getElementById('additional-question').textContent = card.additionalQuestion || '';
    }
    
    // Отобразить блок "или то, или то", если есть
    const alternativesBlock = document.getElementById('alternatives-block');
    const alternativesText = document.getElementById('alternatives-text');
    if (card.alternatives) {
        alternativesText.textContent = card.alternatives;
        alternativesBlock.style.display = 'block';
    } else {
        alternativesBlock.style.display = 'none';
    }
    
    // Обновить состояние кнопок
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    prevButton.disabled = currentCardIndex === 0;
    nextButton.disabled = currentCardIndex === currentDeck.cards.length - 1;
    
    // Сбросить flip состояние
    const flipCard = document.getElementById('flip-card');
    flipCard.classList.remove('flipped');
    isCardFlipped = false;
    
    // Скрыть кнопку переворота для колоды "Большая семья"
    const flipButton = document.getElementById('flip-button');
    if (currentDeck.name === 'Большая семья') {
        flipButton.style.display = 'none';
    } else {
        flipButton.style.display = 'block';
        updateFlipButton();
    }
    
    // Обновить цвет карты
    updateCardColor();
}

// Обновить цвет карты
function updateCardColor() {
    const colorHex = currentDeck.colorHex;
    const cardFront = document.querySelector('.card-front');
    if (cardFront) {
        cardFront.style.background = `linear-gradient(135deg, ${colorHex}E6, ${colorHex}B3, rgba(212, 175, 55, 0.3))`;
    }
}

// Показать случайную карту
function showRandomCard() {
    if (!currentDeck || currentDeck.cards.length <= 1) return;
    
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * currentDeck.cards.length);
    } while (newIndex === currentCardIndex && currentDeck.cards.length > 1);
    
    currentCardIndex = newIndex;
    isCardFlipped = false;
    updateCardViewer();
}

// Показать предыдущую карту
function showPreviousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        isCardFlipped = false;
        updateCardViewer();
    }
}

// Показать следующую карту
function showNextCard() {
    if (currentDeck && currentCardIndex < currentDeck.cards.length - 1) {
        currentCardIndex++;
        isCardFlipped = false;
        updateCardViewer();
    }
}

// Перевернуть карту
function flipCard() {
    const flipCardElement = document.getElementById('flip-card');
    isCardFlipped = !isCardFlipped;
    
    if (isCardFlipped) {
        flipCardElement.classList.add('flipped');
    } else {
        flipCardElement.classList.remove('flipped');
    }
    
    updateFlipButton();
}

// Обновить текст кнопки flip
function updateFlipButton() {
    const button = document.getElementById('flip-button');
    button.textContent = isCardFlipped ? 'Вернуться к началу' : 'Погляди глубже';
}

// Настройка свайпов
function setupSwipeHandlers() {
    const cardContainer = document.getElementById('card-container');
    const flipCardElement = document.getElementById('flip-card');
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let hasMoved = false;
    
    // Обработка клика на карту для переворота (только клик, не свайп)
    flipCardElement.addEventListener('click', (e) => {
        // Если был свайп, не переворачиваем
        if (hasMoved) {
            hasMoved = false;
            return;
        }
        // Не переворачиваем карту для колоды "Большая семья"
        if (currentDeck && currentDeck.name === 'Большая семья') {
            return;
        }
        flipCard();
    });
    
    // Свайпы для переключения карт
    cardContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        hasMoved = false;
        e.preventDefault();
    });
    
    cardContainer.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
        
        const diffX = Math.abs(currentX - startX);
        const diffY = Math.abs(currentY - startY);
        
        // Если движение больше по горизонтали - это свайп
        if (diffX > 10 || diffY > 10) {
            hasMoved = true;
        }
    });
    
    cardContainer.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const diff = currentX - startX;
        const threshold = 50;
        
        // Только если был свайп (не просто клик)
        if (hasMoved && Math.abs(diff) > threshold) {
            e.preventDefault();
            e.stopPropagation();
            if (diff > 0) {
                showPreviousCard();
            } else {
                showNextCard();
            }
        }
        
        startX = 0;
        currentX = 0;
        startY = 0;
        currentY = 0;
        hasMoved = false;
    });
    
    // Также добавим поддержку мыши для свайпов (для тестирования на десктопе)
    cardContainer.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = true;
        hasMoved = false;
    });
    
    cardContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
        currentY = e.clientY;
        const diffX = Math.abs(currentX - startX);
        if (diffX > 10) hasMoved = true;
    });
    
    cardContainer.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const diff = currentX - startX;
        const threshold = 50;
        
        if (hasMoved && Math.abs(diff) > threshold) {
            if (diff > 0) {
                showPreviousCard();
            } else {
                showNextCard();
            }
        }
        
        startX = 0;
        currentX = 0;
        hasMoved = false;
    });
}

// Запуск приложения при загрузке
document.addEventListener('DOMContentLoaded', initApp);

