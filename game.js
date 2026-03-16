/**
 * ARCHITECTURE PATTERN JUSTIFICATION:
 * I chose Option A: Class-based inheritance. 
 * I used a base `GameObject` class that contains the fundamental properties (x, y, width, height, color) 
 * and a generic draw method. The `Player` and `Collectible` classes extend `GameObject` 
 * to inherit these properties while adding their own specific behaviors (like movement for the player). 
 * This creates a clean, logical hierarchy for the game entities.
 * * MESSAGE TYPES DOCUMENTATION:
 * - PLAYER_MOVE: Triggered when the user presses an arrow key. Payload includes direction.
 * - ITEM_COLLECTED: Triggered when the player's coordinates overlap with a collectible. 
 * - SCORE_UPDATE: Triggered immediately after an item is collected to update the UI score.
 */

// --- 1. COMMUNICATION: PUB/SUB SYSTEM ---

const Messages = {
    PLAYER_MOVE: 'PLAYER_MOVE',
    ITEM_COLLECTED: 'ITEM_COLLECTED',
    SCORE_UPDATE: 'SCORE_UPDATE'
};

class EventEmitter {
    constructor() {
        this.listeners = {}; 
    }
    
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }
    
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach(listener => {
                listener(message, payload);
            });
        }
    }
}

// Global Event Bus
const gameEvents = new EventEmitter();

// --- 2. ARCHITECTURE: CLASS-BASED INHERITANCE ---

// Base Class
class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Player Class inheriting from GameObject
class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 30, 30, '#4CAF50'); // Green square
        this.speed = 20;
    }

    move(direction) {
        if (direction === 'up' && this.y > 0) this.y -= this.speed;
        if (direction === 'down' && this.y < 400 - this.height) this.y += this.speed;
        if (direction === 'left' && this.x > 0) this.x -= this.speed;
        if (direction === 'right' && this.x < 600 - this.width) this.x += this.speed;
    }
}

// Collectible Class inheriting from GameObject
class Collectible extends GameObject {
    constructor(x, y) {
        super(x, y, 15, 15, '#FFD700'); // Gold square
    }

    // Randomize position when collected
    respawn() {
        this.x = Math.floor(Math.random() * (600 - this.width));
        this.y = Math.floor(Math.random() * (400 - this.height));
    }
}

// --- 3. GAME SETUP & EVENT WIRING ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

const player = new Player(285, 185);
const coin = new Collectible(100, 100);
let score = 0;

// Subscribe to Events
gameEvents.on(Messages.PLAYER_MOVE, (message, direction) => {
    player.move(direction);
    checkCollisions();
});

gameEvents.on(Messages.ITEM_COLLECTED, () => {
    coin.respawn();
    gameEvents.emit(Messages.SCORE_UPDATE, 10); // Publish score update
});

gameEvents.on(Messages.SCORE_UPDATE, (message, points) => {
    score += points;
    scoreDisplay.innerText = score;
    console.log(`Score updated: ${score}`);
});

// Input Handling (Connecting UI to Event System)
window.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowUp': gameEvents.emit(Messages.PLAYER_MOVE, 'up'); break;
        case 'ArrowDown': gameEvents.emit(Messages.PLAYER_MOVE, 'down'); break;
        case 'ArrowLeft': gameEvents.emit(Messages.PLAYER_MOVE, 'left'); break;
        case 'ArrowRight': gameEvents.emit(Messages.PLAYER_MOVE, 'right'); break;
    }
});

// Simple Collision Detection
function checkCollisions() {
    if (player.x < coin.x + coin.width &&
        player.x + player.width > coin.x &&
        player.y < coin.y + coin.height &&
        player.y + player.height > coin.y) {
        
        // Publish that an item was collected!
        gameEvents.emit(Messages.ITEM_COLLECTED);
    }
}

// Game Loop
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw objects
    coin.draw(ctx);
    player.draw(ctx);
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();