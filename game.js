// --- 1. COMMUNICATION: PUB/SUB SYSTEM ---
const Messages = {
    PLAYER_MOVE: 'PLAYER_MOVE',
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
const gameEvents = new EventEmitter();

// --- 2. ARCHITECTURE: CLASS-BASED INHERITANCE ---
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

class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 45, 45, '#00FF00'); // Green Hero
        this.speed = 20;
    }
    move(direction) {
        if (direction === 'left' && this.x > 0) this.x -= this.speed;
        if (direction === 'right' && this.x < canvas.width - this.width) this.x += this.speed;
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, 40, 40, '#FF0000'); // Red Monster
    }
}

// --- 3. GAME SETUP & RENDERING ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Position hero at center-bottom
const startX = canvas.width / 2 - 45; 
const startY = canvas.height - canvas.height / 4; 
const player = new Player(startX, startY);

// Build 5x5 Enemy Formation
const enemies = [];
const ENEMY_TOTAL = 5;
const ENEMY_SPACING = 98;
const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
const ENEMY_START_X = (canvas.width - FORMATION_WIDTH) / 2;
const ENEMY_STOP_X = ENEMY_START_X + FORMATION_WIDTH;

for (let x = ENEMY_START_X; x < ENEMY_STOP_X; x += ENEMY_SPACING) {
    for (let y = 0; y < 50 * 5; y += 50) {
        enemies.push(new Enemy(x, y));
    }
}

// Subscribe to Events
gameEvents.on(Messages.PLAYER_MOVE, (message, direction) => {
    player.move(direction);
});

// Input Handling
window.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowLeft': gameEvents.emit(Messages.PLAYER_MOVE, 'left'); break;
        case 'ArrowRight': gameEvents.emit(Messages.PLAYER_MOVE, 'right'); break;
    }
});

// Game Loop
function gameLoop() {
    // Draw black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw objects
    player.draw(ctx);
    enemies.forEach(enemy => enemy.draw(ctx));
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();