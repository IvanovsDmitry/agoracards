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

// Инициализация приложения
function initApp() {
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
    document.getElementById('additional-question').textContent = card.additionalQuestion;
    
    // Обновить состояние кнопок
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    prevButton.disabled = currentCardIndex === 0;
    nextButton.disabled = currentCardIndex === currentDeck.cards.length - 1;
    
    // Сбросить flip состояние
    const flipCard = document.getElementById('flip-card');
    flipCard.classList.remove('flipped');
    isCardFlipped = false;
    updateFlipButton();
    
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
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    cardContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });
    
    cardContainer.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
    });
    
    cardContainer.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const diff = currentX - startX;
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                showPreviousCard();
            } else {
                showNextCard();
            }
        }
        
        startX = 0;
        currentX = 0;
    });
    
    // Обработка клика на карту для переворота
    const flipCardElement = document.getElementById('flip-card');
    flipCardElement.addEventListener('click', flipCard);
}

// Запуск приложения при загрузке
document.addEventListener('DOMContentLoaded', initApp);

