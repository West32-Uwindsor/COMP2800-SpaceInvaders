/**
 * @file app.js
 * @description Core game logic for the Space Invaders clone.
 * Now includes rectangle-based collision detection and laser projectiles.
 */

// ==========================================
// SECTION 1: COMMUNICATION & CONSTANTS
// ==========================================

const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE", // New Spacebar event
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER", // New Collision event
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

/**
 * Evaluates separation between two rectangles. 
 * If none of the separation conditions are true, a collision has occurred.
 */
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
        this.dead = false; // Used to safely remove objects between frames
        this.type = "";
    }

    /**
     * Calculates the boundary coordinates of the object for collision detection.
     */
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
        this.cooldown = 0; // Prevents rapid-fire spamming
    }

    fire() {
        // Create laser slightly offset to spawn from the ship's center
        gameObjects.push(new Laser(this.x + 45, this.y - 10));
        this.cooldown = 500; // 500ms weapon cooldown

        let id = setInterval(() => {
            if (this.cooldown > 0) {
                this.cooldown -= 100;
            } else {
                clearInterval(id);
            }
        }, 100);
    }

    canFire() {
        return this.cooldown === 0;
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, 98, 50, '#FF0000');
        this.type = "Enemy";
        
        const id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 5;
            } else {
                clearInterval(id);
            }
        }, 300);
    }
}

/**
 * Laser projectile that travels upward and handles its own lifecycle.
 */
class Laser extends GameObject {
    constructor(x, y) {
        super(x, y, 9, 33, '#FFFF00'); // Yellow laser
        this.type = 'Laser';
        
        let id = setInterval(() => {
            if (this.y > 0) {
                this.y -= 15;
            } else {
                this.dead = true; // Mark dead if it flies off-screen
                clearInterval(id);
            }
        }, 100);
    }
}

// ==========================================
// SECTION 4: GAME INITIALIZATION & EVENTS
// ==========================================

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

function createHero() {
    hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
    gameObjects.push(hero);
}

function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();

    // Movement Events
    eventEmitter.on(Messages.KEY_EVENT_UP, () => { if (hero.y > 0) hero.y -= hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => { if (hero.y < canvas.height - hero.height) hero.y += hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => { if (hero.x > 0) hero.x -= hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => { if (hero.x < canvas.width - hero.width) hero.x += hero.speed; });

    // Firing Event
    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        if (hero.canFire()) {
            hero.fire();
        }
    });

    // Collision Event
    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (message, { first, second }) => {
        first.dead = true;
        second.dead = true;
    });
}

// ==========================================
// SECTION 5: INPUT HANDLING
// ==========================================

const onKeyDown = function (e) {
    switch (e.keyCode) {
        case 37: case 38: case 39: case 40: case 32: 
            e.preventDefault(); 
            break;
    }
};
window.addEventListener("keydown", onKeyDown);

window.addEventListener("keydown", (evt) => {
    if (evt.key === "ArrowUp") eventEmitter.emit(Messages.KEY_EVENT_UP);
    else if (evt.key === "ArrowDown") eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    else if (evt.key === "ArrowLeft") eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    else if (evt.key === "ArrowRight") eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    else if (evt.keyCode === 32) eventEmitter.emit(Messages.KEY_EVENT_SPACE); // Spacebar detection
});

// ==========================================
// SECTION 6: THE GAME LOOP
// ==========================================

/**
 * Checks for intersections between lasers and enemies, emitting collision events.
 * Cleans up "dead" objects so they are removed from the screen safely.
 */
function updateGameObjects() {
    const enemies = gameObjects.filter(go => go.type === 'Enemy');
    const lasers = gameObjects.filter(go => go.type === "Laser");
  
    lasers.forEach((laser) => {
        enemies.forEach((enemy) => {
            if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
                    first: laser,
                    second: enemy,
                });
            }
        });
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
    
    updateGameObjects(); // Run collision checks
    drawGameObjects(ctx);
}, 100);