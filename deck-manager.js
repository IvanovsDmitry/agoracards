// Менеджер колод - управление хранением и загрузкой

class DeckManager {
    constructor() {
        this.decks = [];
        this.decksKey = 'saved_decks';
        this.builtInDecksVersionKey = 'built_in_decks_version';
        this.currentBuiltInDecksVersion = 3;
        
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
            
            const updatedDecks = [...builtInDecks, ...userDecks];
            this.decks = updatedDecks;
            this.saveDecks();
            localStorage.setItem(this.builtInDecksVersionKey, this.currentBuiltInDecksVersion.toString());
        } else {
            // Проверяем, все ли встроенные колоды на месте
            const builtInDecks = BuiltInDecks.allDecks;
            const existingBuiltInNames = new Set(
                this.decks.filter(d => d.isBuiltIn).map(d => d.name)
            );
            const requiredBuiltInNames = new Set(builtInDecks.map(d => d.name));
            
            const missingNames = [...requiredBuiltInNames].filter(name => !existingBuiltInNames.has(name));
            const missingDecks = builtInDecks.filter(d => missingNames.includes(d.name));
            
            if (missingDecks.length > 0) {
                this.decks.push(...missingDecks);
                this.saveDecks();
            }
        }
    }
    
    getDeckById(id) {
        return this.decks.find(d => d.id === id);
    }
}

