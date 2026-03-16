/**
 * @file app.js
 * @description Core game logic for the Space Invaders clone.
 * Now includes Scoring, Lives, and UI rendering.
 */

// ==========================================
// SECTION 1: COMMUNICATION & CONSTANTS
// ==========================================

const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO" // New Collision event
};

class EventEmitter {
    constructor() { this.listeners = {}; }
    on(message, listener) {
        if (!this.listeners[message]) { this.listeners[message] = []; }
        this.listeners[message].push(listener);
    }
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach(listener => { listener(message, payload); });
        }
    }
}

const eventEmitter = new EventEmitter();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameObjects = [];
let hero;

// ==========================================
// SECTION 2: COLLISION MATH
// ==========================================

function intersectRect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

// ==========================================
// SECTION 3: GAME OBJECTS & LIFECYCLES
// ==========================================

class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.dead = false;
        this.type = "";
    }
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Hero extends GameObject {
    constructor(x, y) {
        super(x, y, 98, 75, '#00FF00'); 
        this.type = "Hero";
        this.speed = 15;
        this.cooldown = 0;
        this.life = 3;     // Initialize 3 lives
        this.points = 0;   // Initialize score at 0
    }

    fire() {
        gameObjects.push(new Laser(this.x + 45, this.y - 10));
        this.cooldown = 500;
        let id = setInterval(() => {
            if (this.cooldown > 0) this.cooldown -= 100;
            else clearInterval(id);
        }, 100);
    }
    canFire() { return this.cooldown === 0; }
    
    // Core Feedback Systems
    decrementLife() {
        this.life--;
        if (this.life === 0) {
            this.dead = true;
        }
    }
    incrementPoints() {
        this.points += 100;
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, 98, 50, '#FF0000');
        this.type = "Enemy";
        const id = setInterval(() => {
            if (this.y < canvas.height - this.height) this.y += 5;
            else clearInterval(id);
        }, 300);
    }
}

class Laser extends GameObject {
    constructor(x, y) {
        super(x, y, 9, 33, '#FFFF00'); 
        this.type = 'Laser';
        let id = setInterval(() => {
            if (this.y > 0) this.y -= 15;
            else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}

// ==========================================
// SECTION 4: UI DRAWING FUNCTIONS
// ==========================================

/**
 * Draws the player's remaining lives as simple red squares representing hearts.
 */
function drawLife() {
    const START_POS = canvas.width - 180;
    for(let i=0; i < hero.life; i++ ) {
        // Greyboxing: using small red squares instead of lifeImg to represent hearts
        ctx.fillStyle = '#FF69B4'; // Pink/Red color for life
        ctx.fillRect(START_POS + (45 * (i+1)), canvas.height - 37, 30, 30);
    }
}

/**
 * Renders the score as a large number at the bottom center of the screen.
 */
function drawPoints() {
    ctx.font = "40px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(hero.points.toString(), canvas.width / 2, canvas.height - 20);
}

// ==========================================
// SECTION 5: GAME INITIALIZATION & EVENTS
// ==========================================

function createEnemies() {
    const MONSTER_TOTAL = 5;
    // Maintained user's wider spacing
    const MONSTER_WIDTH = MONSTER_TOTAL * 108; 
    const START_X = (canvas.width - MONSTER_WIDTH) / 2;
    const STOP_X = START_X + MONSTER_WIDTH;

    for (let x = START_X; x < STOP_X; x += 108) {
        for (let y = 0; y < 60 * 5; y += 60) {
            gameObjects.push(new Enemy(x, y));
        }
    }
}

function createHero() {
    hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
    gameObjects.push(hero);
}

function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();

    eventEmitter.on(Messages.KEY_EVENT_UP, () => { if (hero.y > 0) hero.y -= hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => { if (hero.y < canvas.height - hero.height) hero.y += hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => { if (hero.x > 0) hero.x -= hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => { if (hero.x < canvas.width - hero.width) hero.x += hero.speed; });

    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => { if (hero.canFire()) hero.fire(); });

    // Enemy hit by Laser
    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        first.dead = true;
        second.dead = true;
        hero.incrementPoints();
    });

    // Enemy crashes into Hero
    eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
        enemy.dead = true;
        hero.decrementLife();
    });
}

// ==========================================
// SECTION 6: INPUT HANDLING
// ==========================================

const onKeyDown = function (e) {
    switch (e.keyCode) {
        case 37: case 38: case 39: case 40: case 32: 
            e.preventDefault(); break;
    }
};
window.addEventListener("keydown", onKeyDown);

window.addEventListener("keydown", (evt) => {
    if (evt.key === "ArrowUp") eventEmitter.emit(Messages.KEY_EVENT_UP);
    else if (evt.key === "ArrowDown") eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    else if (evt.key === "ArrowLeft") eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    else if (evt.key === "ArrowRight") eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    else if (evt.keyCode === 32) eventEmitter.emit(Messages.KEY_EVENT_SPACE);
});

// ==========================================
// SECTION 7: THE GAME LOOP
// ==========================================

function updateGameObjects() {
    const enemies = gameObjects.filter(go => go.type === 'Enemy');
    const lasers = gameObjects.filter(go => go.type === "Laser");
  
    // Laser vs Enemy Check
    lasers.forEach((laser) => {
        enemies.forEach((enemy) => {
            if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, { first: laser, second: enemy });
            }
        });
    });

    // Hero vs Enemy Check
    enemies.forEach(enemy => {
        const heroRect = hero.rectFromGameObject();
        if (intersectRect(heroRect, enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
    });

    gameObjects = gameObjects.filter(go => !go.dead);
}

function drawGameObjects(ctx) {
    gameObjects.forEach(go => go.draw(ctx));
}

initGame();

const gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    updateGameObjects();
    drawGameObjects(ctx);
    
    // Render UI Elements on top of game objects
    drawPoints();
    drawLife();
    
}, 100);