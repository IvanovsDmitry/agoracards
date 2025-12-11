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
    // Поменяли местами функции: random-button теперь переворачивает, flip-button показывает случайную
    document.getElementById('random-button').addEventListener('click', flipCard);
    document.getElementById('prev-button').addEventListener('click', showPreviousCard);
    document.getElementById('next-button').addEventListener('click', showNextCard);
    document.getElementById('flip-button').addEventListener('click', showRandomCard);
    
    // Обработчик свайпов
    setupSwipeHandlers();
}

// Показать список колод
function showDeckList() {
    document.getElementById('deck-list-screen').classList.add('active');
    document.getElementById('card-viewer-screen').classList.remove('active');
    document.getElementById('edit-deck-screen').classList.remove('active');
    
    // Отслеживаем возврат на главный экран
    if (analytics) {
        analytics.trackScreenView('deck_list');
    }
    
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
    // Специальный класс для колоды "Атака титанов"
    const deckClass = deck.name === "Атака титанов" ? "deck-card aot-deck" : "deck-card";
    card.className = deckClass;
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
    
    // Отслеживаем открытие колоды
    if (analytics) {
        analytics.trackDeckOpen(deck.name);
        analytics.trackScreenView(`deck_${deck.name}`);
    }
    
    document.getElementById('deck-list-screen').classList.remove('active');
    const cardViewerScreen = document.getElementById('card-viewer-screen');
    cardViewerScreen.classList.add('active');
    
    // Добавляем специальный класс для AOT колоды
    if (deck.name === "Атака титанов") {
        cardViewerScreen.classList.add('aot-card-viewer');
    } else {
        cardViewerScreen.classList.remove('aot-card-viewer');
    }
    
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
    
    // Специальная обработка для колоды "Вопросы вечности"
    const eternityHintBlock = document.getElementById('eternity-hint-block');
    const alternativesBlock = document.getElementById('alternatives-block');
    
    // Скрываем новую структуру для специальных колод
    const cardBackSplit = document.getElementById('card-back-split');
    const cardBackSimple = document.getElementById('card-back-simple');
    
    if (currentDeck.name === "Вопросы вечности" || currentDeck.name === "Атака титанов") {
        // Для специальных колод показываем старую структуру
        if (cardBackSplit) cardBackSplit.style.display = 'none';
        if (cardBackSimple) cardBackSimple.style.display = 'block';
        
        // Для колоды "Вопросы вечности" и "Атака титанов" парсим подсказку и уточняющий вопрос
        alternativesBlock.style.display = 'none';
        eternityHintBlock.style.display = 'none';
        
        if (card.additionalQuestion) {
            // Формат: "Уточняющий вопрос\n\n💭 Подсказка: ...\n\n«Цитата»"
            const text = card.additionalQuestion;
            
            // Ищем подсказку
            const hintMatch = text.match(/💭 Подсказка:/);
            if (hintMatch) {
                const hintIndex = hintMatch.index;
                // Всё после "💭 Подсказка:"
                const afterHint = text.substring(hintIndex).replace(/💭 Подсказка:\s*/, '').trim();
                
                // Разделяем по двойным переносам строк
                const parts = afterHint.split(/\n\n+/);
                
                // Последняя часть - это уточняющий вопрос
                const clarifyingQuestion = parts[parts.length - 1].trim();
                
                // Всё до последней части - это подсказка с цитатой
                const hintWithQuote = parts.slice(0, -1).join('\n\n').trim();
                
                // Убираем цитату из подсказки (между « и »)
                const hintWithoutQuote = hintWithQuote.replace(/«[^»]*»\s*/g, '').trim();
                
                // Порядок отображения: подсказка (курсив) → пропуск → уточняющий вопрос (обычный)
                const additionalQuestionEl = document.getElementById('additional-question');
                if (additionalQuestionEl) {
                    additionalQuestionEl.textContent = '';
                }
                document.getElementById('hint-text').textContent = hintWithoutQuote;
                document.getElementById('clarifying-question').textContent = clarifyingQuestion;
                eternityHintBlock.style.display = 'block';
            } else {
                // Если формат не найден, показываем как обычно
                const additionalQuestionEl = document.getElementById('additional-question');
                if (additionalQuestionEl) {
                    additionalQuestionEl.textContent = card.additionalQuestion;
                }
                eternityHintBlock.style.display = 'none';
            }
        } else {
            const additionalQuestionEl = document.getElementById('additional-question');
            if (additionalQuestionEl) {
                additionalQuestionEl.textContent = '';
            }
            eternityHintBlock.style.display = 'none';
        }
    } else {
        // Для остальных колод - новая структура с двумя вопросами
        eternityHintBlock.style.display = 'none';
        const quizAnswer = document.getElementById('quiz-answer');
        quizAnswer.style.display = 'none';
        
        // Показываем новую структуру (две части)
        const cardBackSplit = document.getElementById('card-back-split');
        const cardBackSimple = document.getElementById('card-back-simple');
        
        if (cardBackSplit && cardBackSimple) {
            cardBackSplit.style.display = 'flex';
            cardBackSimple.style.display = 'none';
            
            // Основной вопрос (верхняя часть)
            const mainQuestionBack = document.getElementById('main-question-back');
            if (mainQuestionBack) {
                mainQuestionBack.textContent = card.mainQuestion;
            }
            
            // Дополнительный вопрос (нижняя часть)
            const additionalQuestionBack = document.getElementById('additional-question-back');
            if (additionalQuestionBack) {
                additionalQuestionBack.textContent = card.additionalQuestion || '';
            }
        }
        
        // Отобразить блок "или то, или то", если есть (скрываем, так как используем новую структуру)
        const alternativesText = document.getElementById('alternatives-text');
        const alternativesDivider = document.getElementById('alternatives-divider');
        if (alternativesText && alternativesDivider) {
            alternativesBlock.style.display = 'none';
            alternativesDivider.style.display = 'none';
        }
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
    updateFlipButton();
    
    // Обновить цвет карты
    updateCardColor();
}

// Обновить цвет карты и применить иллюстрации
function updateCardColor() {
    const cardFront = document.querySelector('.card-front');
    const cardBack = document.querySelector('.card-back');
    const cardFrontBg = document.getElementById('card-front-bg');
    const cardBackBg = document.getElementById('card-back-bg');
    const flipCard = document.getElementById('flip-card');
    
    // Убираем все паттерны
    if (flipCard) {
        flipCard.classList.remove('deck-illustration-pattern-1', 'deck-illustration-pattern-2', 
            'deck-illustration-pattern-3', 'deck-illustration-pattern-4', 'deck-illustration-pattern-5');
    }
    
    // Убираем все классы стилей
    if (flipCard) {
        flipCard.classList.remove('aot-card', 'deck-illustration-pattern-1', 'deck-illustration-pattern-2', 
            'deck-illustration-pattern-3', 'deck-illustration-pattern-4', 'deck-illustration-pattern-5',
            'deck-friends', 'deck-kids', 'deck-family', 'deck-couples', 'deck-bestfriends', 'deck-eternity');
    }
    
    // Применяем индивидуальные стили для каждой колоды
    const deckName = currentDeck.name;
    
    if (deckName === "Атака титанов") {
        // Специальный дизайн для "Атака титанов"
        if (flipCard) flipCard.classList.add('aot-card');
        if (cardFrontBg) cardFrontBg.style.display = 'none';
        if (cardBackBg) cardBackBg.style.display = 'none';
    } else if (deckName === "Компания людей") {
        if (flipCard) flipCard.classList.add('deck-friends');
        if (cardFrontBg) cardFrontBg.style.display = 'block';
        if (cardBackBg) cardBackBg.style.display = 'block';
    } else if (deckName === "Маленькие люди") {
        if (flipCard) flipCard.classList.add('deck-kids');
        if (cardFrontBg) cardFrontBg.style.display = 'block';
        if (cardBackBg) cardBackBg.style.display = 'block';
    } else if (deckName === "Большая семья") {
        if (flipCard) flipCard.classList.add('deck-family');
        if (cardFrontBg) cardFrontBg.style.display = 'block';
        if (cardBackBg) cardBackBg.style.display = 'block';
    } else if (deckName === "Узнать друг друга глубже") {
        if (flipCard) flipCard.classList.add('deck-couples');
        if (cardFrontBg) cardFrontBg.style.display = 'block';
        if (cardBackBg) cardBackBg.style.display = 'block';
    } else if (deckName === "Мой любимый собеседник") {
        if (flipCard) flipCard.classList.add('deck-bestfriends');
        if (cardFrontBg) cardFrontBg.style.display = 'block';
        if (cardBackBg) cardBackBg.style.display = 'block';
    } else if (deckName === "Вопросы вечности") {
        if (flipCard) flipCard.classList.add('deck-eternity');
        if (cardFrontBg) cardFrontBg.style.display = 'block';
        if (cardBackBg) cardBackBg.style.display = 'block';
    }
    
    // Применяем цвет колоды к картам (если не AOT)
    if (deckName !== "Атака титанов") {
        const colorHex = currentDeck.colorHex;
        if (cardFront) {
            cardFront.style.background = `linear-gradient(135deg, ${colorHex}E6, ${colorHex}B3, rgba(212, 175, 55, 0.3))`;
            cardFront.style.border = `2px solid rgba(255, 255, 255, 0.3)`;
        }
        if (cardBack) {
            cardBack.style.border = `2px solid rgba(255, 255, 255, 0.3)`;
        }
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
    
    // Отслеживаем случайную карту
    if (analytics) {
        analytics.trackRandomCard(currentDeck.name);
    }
    
    updateCardViewer();
}

// Показать предыдущую карту
function showPreviousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        isCardFlipped = false;
        
        // Отслеживаем переключение карты
        if (analytics && currentDeck) {
            analytics.trackCardChange(currentDeck.name, 'previous');
        }
        
        updateCardViewer();
    }
}

// Показать следующую карту
function showNextCard() {
    if (currentDeck && currentCardIndex < currentDeck.cards.length - 1) {
        currentCardIndex++;
        isCardFlipped = false;
        
        // Отслеживаем переключение карты
        if (analytics && currentDeck) {
            analytics.trackCardChange(currentDeck.name, 'next');
        }
        
        updateCardViewer();
    }
}

// Перевернуть карту
function flipCard() {
    const flipCardElement = document.getElementById('flip-card');
    isCardFlipped = !isCardFlipped;
    
    // Отслеживаем переворот карты
    if (analytics && currentDeck) {
        analytics.trackCardFlip(currentDeck.name);
    }
    
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
    // Кнопка теперь показывает случайную карту, текст не меняется
    button.textContent = '✨ Пусть судьба выберет';
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

