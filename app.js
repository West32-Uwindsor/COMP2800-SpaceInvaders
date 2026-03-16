/**
 * @file app.js
 * @description Core game logic for the Space Invaders clone.
 * Final Version with Sprite Image Rendering.
 */

// ==========================================
// SECTION 1: COMMUNICATION & CONSTANTS
// ==========================================

/**
 * Messages used for event communication between game components.
 */
const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
    GAME_END_LOSS: "GAME_END_LOSS",
    GAME_END_WIN: "GAME_END_WIN"
};

/**
 * Simple event emitter for handling game events.
 */
class EventEmitter {
    constructor() {
        this.listeners = {};
    }

    /**
     * Registers a listener for a specific message.
     * @param {string} message - The message to listen for.
     * @param {function} listener - The callback function to execute.
     */
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }

    /**
     * Emits a message to all registered listeners.
     * @param {string} message - The message to emit.
     * @param {*} payload - Optional data to pass to listeners.
     */
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach(listener => {
                listener(message, payload);
            });
        }
    }

    /**
     * Clears all listeners.
     */
    clear() {
        this.listeners = {};
    }
}

const eventEmitter = new EventEmitter();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameObjects = [];
let hero;
let gameLoopId;

// Global variables for our image assets
let heroImg, enemyImg, laserImg, lifeImg;

// ==========================================
// SECTION 2: ASSET LOADING & COLLISION MATH
// ==========================================

/**
 * Loads an image texture asynchronously.
 * @param {string} path - The path to the image file.
 * @returns {Promise<Image>} A promise that resolves to the loaded image.
 */
async function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            resolve(img);
        };
    });
}

/**
 * Checks if two rectangles intersect.
 * @param {Object} r1 - First rectangle with top, left, bottom, right.
 * @param {Object} r2 - Second rectangle with top, left, bottom, right.
 * @returns {boolean} True if rectangles intersect, false otherwise.
 */
function intersectRect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

/**
 * Checks if the hero is dead.
 * @returns {boolean} True if hero has no lives left.
 */
function isHeroDead() {
    return hero.life <= 0;
}

/**
 * Checks if all enemies are dead.
 * @returns {boolean} True if no living enemies remain.
 */
function isEnemiesDead() {
    const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
    return enemies.length === 0;
}

// ==========================================
// SECTION 3: GAME OBJECTS & LIFECYCLES
// ==========================================

/**
 * Base class for all game objects.
 */
class GameObject {
    /**
     * Creates a new game object.
     * @param {number} x - X position.
     * @param {number} y - Y position.
     * @param {number} width - Width of the object.
     * @param {number} height - Height of the object.
     * @param {Image} img - Image to render.
     */
    constructor(x, y, width, height, img) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.img = img;
        this.dead = false;
        this.type = "";
    }

    /**
     * Returns the bounding rectangle of the game object.
     * @returns {Object} Rectangle with top, left, bottom, right.
     */
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }

    /**
     * Draws the game object on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     */
    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}

/**
 * Represents the player's ship.
 */
class Hero extends GameObject {
    /**
     * Creates the hero ship.
     * @param {number} x - X position.
     * @param {number} y - Y position.
     */
    constructor(x, y) {
        super(x, y, 98, 75, heroImg);
        this.type = "Hero";
        this.speed = 15;
        this.cooldown = 0;
        this.life = 3;
        this.points = 0;
    }

    /**
     * Fires a laser from the hero.
     */
    fire() {
        gameObjects.push(new Laser(this.x + 45, this.y - 10));
        this.cooldown = 500;
        let id = setInterval(() => {
            if (this.cooldown > 0) this.cooldown -= 100;
            else clearInterval(id);
        }, 100);
    }

    /**
     * Checks if the hero can fire a laser.
     * @returns {boolean} True if cooldown is zero.
     */
    canFire() {
        return this.cooldown === 0;
    }

    /**
     * Decreases the hero's life by one.
     */
    decrementLife() {
        this.life--;
        if (this.life === 0) {
            this.dead = true;
        }
    }

    /**
     * Increases the hero's points.
     */
    incrementPoints() {
        this.points += 100;
    }
}

let enemyDirection = 1; // 1 for right, -1 for left

/**
 * Represents an enemy ship.
 */
class Enemy extends GameObject {
    /**
     * Creates an enemy ship.
     * @param {number} x - X position.
     * @param {number} y - Y position.
     */
    constructor(x, y) {
        super(x, y, 98, 50, enemyImg);
        this.type = "Enemy";
    }
}

/**
 * Represents a laser projectile.
 */
class Laser extends GameObject {
    /**
     * Creates a laser.
     * @param {number} x - X position.
     * @param {number} y - Y position.
     */
    constructor(x, y) {
        super(x, y, 9, 33, laserImg);
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
// SECTION 4: UI & STATE DISPLAYS
// ==========================================

/**
 * Draws the hero's remaining lives on the canvas.
 */
function drawLife() {
    const START_POS = canvas.width - 180;
    for (let i = 0; i < hero.life; i++) {
        ctx.drawImage(lifeImg, START_POS + (45 * (i + 1)), canvas.height - 37, 30, 30);
    }
}

/**
 * Draws the hero's current points on the canvas.
 */
function drawPoints() {
    ctx.font = "40px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(hero.points.toString(), canvas.width / 2, canvas.height - 20);
}

/**
 * Displays a message on the canvas.
 * @param {string} message - The message to display.
 * @param {string} color - The color of the text.
 */
function displayMessage(message, color = "red") {
    ctx.font = "30px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

/**
 * Handles the end of the game, displaying win or loss message.
 * @param {boolean} win - True if the player won, false if lost.
 */
function endGame(win) {
    clearInterval(gameLoopId);

    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000033"; // Super dark blue background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (win) {
            displayMessage("Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew", "green");
        } else {
            displayMessage("You died !!! Press [Enter] to start a new game Captain Pew Pew");
        }
    }, 200);
}

// ==========================================
// SECTION 5: GAME INITIALIZATION & RESET
// ==========================================

/**
 * Creates and positions the enemy ships on the canvas.
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
 * Creates and positions the hero ship.
 */
function createHero() {
    hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
    gameObjects.push(hero);
}

/**
 * Initializes the game state and event listeners.
 */
function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();

    eventEmitter.on(Messages.KEY_EVENT_UP, () => { if (hero.y > 0) hero.y -= hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => { if (hero.y < canvas.height - hero.height) hero.y += hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => { if (hero.x > 0) hero.x -= hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => { if (hero.x < canvas.width - hero.width) hero.x += hero.speed; });
    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => { if (hero.canFire()) hero.fire(); });

    eventEmitter.on(Messages.KEY_EVENT_ENTER, () => { resetGame(); });

    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        first.dead = true;
        second.dead = true;
        hero.incrementPoints();
        if (isEnemiesDead()) {
            eventEmitter.emit(Messages.GAME_END_WIN);
        }
    });

    eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
        enemy.dead = true;
        hero.decrementLife();
        if (isHeroDead()) {
            eventEmitter.emit(Messages.GAME_END_LOSS);
            return;
        }
        if (isEnemiesDead()) {
            eventEmitter.emit(Messages.GAME_END_WIN);
        }
    });

    eventEmitter.on(Messages.GAME_END_WIN, () => { endGame(true); });
    eventEmitter.on(Messages.GAME_END_LOSS, () => { endGame(false); });
}

/**
 * Resets the game to start a new round.
 */
function resetGame() {
    if (gameLoopId) {
        clearInterval(gameLoopId);
        eventEmitter.clear();
        initGame();

        gameLoopId = setInterval(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000033"; // Super dark blue background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            updateGameObjects();
            drawGameObjects(ctx);
            drawPoints();
            drawLife();
        }, 100);
    }
}

// ==========================================
// SECTION 6: INPUT HANDLING
// ==========================================

/**
 * Prevents default behavior for certain key presses to avoid page scrolling.
 * @param {KeyboardEvent} e - The keydown event.
 */
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
    else if (evt.key === "Enter") eventEmitter.emit(Messages.KEY_EVENT_ENTER);
    else if (evt.keyCode === 32) eventEmitter.emit(Messages.KEY_EVENT_SPACE);
});

// ==========================================
// SECTION 7: THE GAME LOOP & ASSET WAITING
// ==========================================

/**
 * Updates the state of all game objects, including movement and collisions.
 */
function updateGameObjects() {
    const enemies = gameObjects.filter(go => go.type === 'Enemy');
    const lasers = gameObjects.filter(go => go.type === "Laser");

    // Update enemy positions
    let shouldMoveDown = false;
    enemies.forEach(enemy => {
        enemy.x += enemyDirection * 5;
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            shouldMoveDown = true;
        }
    });
    if (shouldMoveDown) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            enemy.y += 20; // Move down
        });
    }

    lasers.forEach((laser) => {
        enemies.forEach((enemy) => {
            if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, { first: laser, second: enemy });
            }
        });
    });

    enemies.forEach(enemy => {
        const heroRect = hero.rectFromGameObject();
        if (intersectRect(heroRect, enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
    });

    gameObjects = gameObjects.filter(go => !go.dead);
}

/**
 * Draws all active game objects on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 */
function drawGameObjects(ctx) {
    gameObjects.forEach(go => go.draw(ctx));
}

// Ensure all images are fully loaded BEFORE starting the game
window.onload = async () => {
    // Load all required image assets
    heroImg = await loadTexture('player.png');
    enemyImg = await loadTexture('enemyShip.png');
    laserImg = await loadTexture('laserRed.png');
    lifeImg = await loadTexture('life.png');

    initGame();

    gameLoopId = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000033"; // Super dark blue background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateGameObjects();
        drawGameObjects(ctx);
        drawPoints();
        drawLife();
    }, 100);
};