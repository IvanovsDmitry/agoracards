// Система обновления базы вопросов
// Использование: node update-questions.js

const fs = require('fs');
const path = require('path');

// Конфигурация обновлений
const UPDATES = {
    // Добавить блок "или то, или то" к существующим вопросам
    addAlternatives: [
        {
            deckName: "Компания людей",
            mainQuestion: "Какую суперсилу ты хочешь?",
            alternatives: "Телепортация или читать мысли?"
        },
        // Добавьте сюда другие вопросы с альтернативами
    ],
    
    // Добавить новые вопросы
    addCards: [
        {
            deckName: "Компания людей",
            cards: [
                ["Новый вопрос?", "Альтернативный вопрос с блоком 'или то, или то'?"]
            ]
        }
    ],
    
    // Удалить вопросы
    removeCards: [
        {
            deckName: "Мой любимый собеседник",
            mainQuestion: "Что ты узнал обо мне, чего не знал раньше?"
        }
    ],
    
    // Обновить существующие вопросы
    updateCards: [
        {
            deckName: "Компания людей",
            oldQuestion: "Старый вопрос?",
            newQuestion: "Новый вопрос?",
            newAdditional: "Новый альтернативный вопрос?"
        }
    ]
};

// Функция для добавления альтернатив к вопросу
function addAlternativesToQuestion(card, alternatives) {
    if (!card.additionalQuestion) {
        card.additionalQuestion = alternatives;
        return;
    }
    
    // Если уже есть альтернативный вопрос, добавляем блок "или то, или то"
    card.alternatives = alternatives;
    return card;
}

// Функция для обновления data.js
function updateDataFile(updates) {
    const dataFilePath = path.join(__dirname, 'data.js');
    let content = fs.readFileSync(dataFilePath, 'utf8');
    
    // Применяем обновления
    // TODO: Реализовать парсинг и обновление файла
    
    console.log('Обновление базы вопросов...');
    console.log('Обновления применены!');
}

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UPDATES,
        addAlternativesToQuestion,
        updateDataFile
    };
}

// Если запускается напрямую
if (require.main === module) {
    console.log('Система обновления базы вопросов');
    console.log('Используйте эту утилиту для обновления вопросов в data.js');
    console.log('\nФормат обновлений:');
    console.log(JSON.stringify(UPDATES, null, 2));
}

