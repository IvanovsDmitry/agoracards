// Менеджер колод - управление хранением и загрузкой

class DeckManager {
    constructor() {
        this.decks = [];
        this.decksKey = 'saved_decks';
        this.builtInDecksVersionKey = 'built_in_decks_version';
        this.currentBuiltInDecksVersion = 6; // Версия 6: обновлена колода "Большая семья" (новые вопросы, без переворота карт)
        
        // Маппинг старых названий колод на новые
        this.oldDeckNames = [
            'Компания друзей 16+',
            'Дети 5+',
            'Для пар',
            'Лучшие друзья'
        ];
        
        this.loadDecks();
        if (this.decks.length === 0) {
            this.initializeBuiltInDecks();
        } else {
            this.updateBuiltInDecksIfNeeded();
        }
    }
    
    loadDecks() {
        try {
            const data = localStorage.getItem(this.decksKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.decks = parsed.map(deck => Deck.fromJSON(deck));
            }
        } catch (error) {
            console.error('Ошибка загрузки колод:', error);
            this.decks = [];
        }
    }
    
    saveDecks() {
        try {
            const data = JSON.stringify(this.decks.map(deck => deck.toJSON()));
            localStorage.setItem(this.decksKey, data);
        } catch (error) {
            console.error('Ошибка сохранения колод:', error);
        }
    }
    
    addDeck(deck) {
        this.decks.push(deck);
        this.saveDecks();
    }
    
    updateDeck(deck) {
        const index = this.decks.findIndex(d => d.id === deck.id);
        if (index !== -1) {
            this.decks[index] = deck;
            this.saveDecks();
        }
    }
    
    deleteDeck(deckId) {
        this.decks = this.decks.filter(d => d.id !== deckId);
        this.saveDecks();
    }
    
    deleteCard(cardId, deckId) {
        const deck = this.decks.find(d => d.id === deckId);
        if (deck) {
            deck.cards = deck.cards.filter(c => c.id !== cardId);
            this.saveDecks();
        }
    }
    
    addCard(card, deckId) {
        const deck = this.decks.find(d => d.id === deckId);
        if (deck) {
            deck.cards.push(card);
            this.saveDecks();
        }
    }
    
    initializeBuiltInDecks() {
        this.decks = [...BuiltInDecks.allDecks];
        this.saveDecks();
        localStorage.setItem(this.builtInDecksVersionKey, this.currentBuiltInDecksVersion.toString());
    }
    
    updateBuiltInDecksIfNeeded() {
        const savedVersion = parseInt(localStorage.getItem(this.builtInDecksVersionKey) || '0');
        
        if (savedVersion < this.currentBuiltInDecksVersion) {
            const builtInDecks = BuiltInDecks.allDecks;
            const userDecks = this.decks.filter(d => !d.isBuiltIn);
            
            // Маппинг старых названий на новые (для замены)
            const oldToNewNames = {
                'Компания друзей 16+': 'Компания людей',
                'Дети 5+': 'Маленькие люди',
                'Для пар': 'Узнать друг друга глубже',
                'Лучшие друзья': 'Мой любимый собеседник'
            };
            
            // Удаляем старые встроенные колоды (по старым и новым названиям)
            const allOldNames = Object.keys(oldToNewNames);
            const allNewNames = Object.values(oldToNewNames);
            const allBuiltInNames = builtInDecks.map(d => d.name);
            const namesToRemove = new Set([...allOldNames, ...allNewNames, ...allBuiltInNames]);
            
            // Фильтруем: оставляем только пользовательские колоды (не старые встроенные)
            const filteredUserDecks = userDecks.filter(d => {
                // Удаляем колоды со старыми названиями (даже если они пользовательские)
                if (this.oldDeckNames.includes(d.name)) {
                    return false;
                }
                return true; // Оставляем только настоящие пользовательские колоды
            });
            
            // Составляем итоговый список: новые встроенные + пользовательские
            const updatedDecks = [...builtInDecks, ...filteredUserDecks];
            this.decks = updatedDecks;
            this.saveDecks();
            localStorage.setItem(this.builtInDecksVersionKey, this.currentBuiltInDecksVersion.toString());
        } else {
            // Проверяем, все ли встроенные колоды на месте и удаляем старые
            const builtInDecks = BuiltInDecks.allDecks;
            const requiredBuiltInNames = new Set(builtInDecks.map(d => d.name));
            
            // Фильтруем: удаляем старые встроенные колоды и колоды со старыми названиями
            this.decks = this.decks.filter(d => {
                // Удаляем колоды со старыми названиями (встроенные или пользовательские)
                if (this.oldDeckNames.includes(d.name)) {
                    return false;
                }
                
                // Если это пользовательская колода - оставляем
                if (!d.isBuiltIn) {
                    return true;
                }
                
                // Если это встроенная колода - оставляем только актуальные
                return requiredBuiltInNames.has(d.name);
            });
            
            // Добавляем недостающие актуальные встроенные колоды
            const existingBuiltInNames = new Set(
                this.decks.filter(d => d.isBuiltIn).map(d => d.name)
            );
            const missingNames = [...requiredBuiltInNames].filter(name => !existingBuiltInNames.has(name));
            const missingDecks = builtInDecks.filter(d => missingNames.includes(d.name));
            
            if (missingDecks.length > 0) {
                this.decks.push(...missingDecks);
            }
            
            this.saveDecks();
        }
    }
    
    getDeckById(id) {
        return this.decks.find(d => d.id === id);
    }
}

