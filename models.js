// Модели данных - аналоги Swift структурам

class Card {
    constructor(id = null, mainQuestion, additionalQuestion) {
        this.id = id || this.generateId();
        this.mainQuestion = mainQuestion;
        this.additionalQuestion = additionalQuestion;
    }
    
    generateId() {
        return 'card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    toJSON() {
        return {
            id: this.id,
            mainQuestion: this.mainQuestion,
            additionalQuestion: this.additionalQuestion
        };
    }
    
    static fromJSON(json) {
        return new Card(json.id, json.mainQuestion, json.additionalQuestion);
    }
}

class Deck {
    constructor(id = null, name, emoji, colorHex, cards = [], isBuiltIn = false, ageRating = null) {
        this.id = id || this.generateId();
        this.name = name;
        this.emoji = emoji;
        this.colorHex = colorHex;
        this.cards = cards.map(card => card instanceof Card ? card : Card.fromJSON(card));
        this.isBuiltIn = isBuiltIn;
        this.ageRating = ageRating;
    }
    
    generateId() {
        return 'deck-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    get cardCount() {
        return this.cards.length;
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            emoji: this.emoji,
            colorHex: this.colorHex,
            cards: this.cards.map(card => card.toJSON()),
            isBuiltIn: this.isBuiltIn,
            ageRating: this.ageRating
        };
    }
    
    static fromJSON(json) {
        return new Deck(
            json.id,
            json.name,
            json.emoji,
            json.colorHex,
            json.cards || [],
            json.isBuiltIn || false,
            json.ageRating || null
        );
    }
}

