/**
 * @file app.js
 * @description Core game logic for the Space Invaders clone.
 * This file handles game initialization, the pub/sub event system, object inheritance, 
 * input handling, and the main animation loop.
 */

// ==========================================
// SECTION 1: COMMUNICATION & CONSTANTS
// ==========================================

/**
 * Defines message constants for the Pub/Sub system.
 * Using constants prevents typos and makes refactoring easier.
 * @constant {Object}
 */
const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
};

/**
 * EventEmitter class implements the Publish-Subscribe pattern.
 * This separates input detection from game logic, making the code modular.
 */
class EventEmitter {
    constructor() {
        this.listeners = {};
    }

    /**
     * Subscribes a listener function to a specific message type.
     * @param {string} message - The event name to listen for.
     * @param {Function} listener - The callback function to execute.
     */
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }

    /**
     * Publishes a message, triggering all subscribed listeners.
     * @param {string} message - The event name to broadcast.
     * @param {*} [payload=null] - Optional data to pass to the listeners.
     */
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach(listener => {
                listener(message, payload);
            });
        }
    }
}

// Global variables for game state
const eventEmitter = new EventEmitter();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameObjects = [];
let hero;

// ==========================================
// SECTION 2: GAME OBJECTS (INHERITANCE)
// ==========================================

/**
 * Base class for all entities in the game.
 * Defines common properties like position, size, and rendering logic.
 */
class GameObject {
    /**
     * @param {number} x - The starting horizontal coordinate.
     * @param {number} y - The starting vertical coordinate.
     * @param {number} width - The width of the object.
     * @param {number} height - The height of the object.
     * @param {string} color - The hex color code for the greybox rectangle.
     */
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.dead = false;
        this.type = "";
    }

    /**
     * Draws the object onto the canvas using its properties.
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

/**
 * Hero class extending GameObject to represent the player.
 */
class Hero extends GameObject {
    constructor(x, y) {
        super(x, y, 98, 75, '#00FF00'); // Green hero ship
        this.type = "Hero";
        this.speed = 15;
    }
}

/**
 * Enemy class extending GameObject to represent alien ships.
 * Includes automatic downward movement on a set interval.
 */
class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, 98, 50, '#FF0000'); // Red enemy ship
        this.type = "Enemy";
        
        // Automatic movement: Moves down 5 pixels every 300ms
        const id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 5;
            } else {
                console.log('Enemy stopped at bottom boundary:', this.y);
                clearInterval(id);
            }
        }, 300);
    }
}

// ==========================================
// SECTION 3: GAME INITIALIZATION
// ==========================================

/**
 * Generates a 5x5 grid of Enemy objects and adds them to the game array.
 */
function createEnemies() {
    const MONSTER_TOTAL = 5;
    const MONSTER_WIDTH = MONSTER_TOTAL * 108;
    const START_X = (canvas.width - MONSTER_WIDTH) / 2;
    const STOP_X = START_X + MONSTER_WIDTH;

    for (let x = START_X; x < STOP_X; x += 108) {
        for (let y = 0; y < 60 * 5; y += 60) {
            gameObjects.push(new Enemy(x, y));
        }
    }
}

/**
 * Creates the player Hero object and places it at the bottom center of the screen.
 */
function createHero() {
    hero = new Hero(
        canvas.width / 2 - 45,
        canvas.height - canvas.height / 4
    );
    gameObjects.push(hero);
}

/**
 * Initializes the game state, spawns entities, and maps pub/sub movement listeners.
 */
function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();

    // Map events to hero movement
    eventEmitter.on(Messages.KEY_EVENT_UP, () => { hero.y -= hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => { hero.y += hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => { hero.x -= hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => { hero.x += hero.speed; });
}

// ==========================================
// SECTION 4: INPUT HANDLING
// ==========================================

/**
 * Intercepts default browser behaviors (like scrolling) for game control keys.
 * @param {KeyboardEvent} e - The fired keyboard event.
 */
const onKeyDown = function (e) {
    switch (e.keyCode) {
        case 37: // Left Arrow
        case 38: // Up Arrow
        case 39: // Right Arrow
        case 40: // Down Arrow
        case 32: // Spacebar
            e.preventDefault();
            break;
        default:
            break; 
    }
};
window.addEventListener("keydown", onKeyDown);

/**
 * Listens for keydown events to trigger game actions via the Pub/Sub system.
 * (Note: Changed from 'keyup' to 'keydown' for smoother, continuous gameplay).
 */
window.addEventListener("keydown", (evt) => {
    if (evt.key === "ArrowUp") {
        eventEmitter.emit(Messages.KEY_EVENT_UP);
    } else if (evt.key === "ArrowDown") {
        eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    } else if (evt.key === "ArrowLeft") {
        eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    } else if (evt.key === "ArrowRight") {
        eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    }
});

// ==========================================
// SECTION 5: GAME LOOP
// ==========================================

/**
 * Iterates through all active game objects and calls their draw methods.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
 */
function drawGameObjects(ctx) {
    gameObjects.forEach(go => go.draw(ctx));
}

// Initialize the game state before starting the loop
initGame();

/**
 * Main Game Loop.
 * Runs every 100 milliseconds to clear the screen and render the next frame.
 */
const gameLoopId = setInterval(() => {
    // 1. Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. Fill the black background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 3. Render all updated objects
    drawGameObjects(ctx);
}, 100);