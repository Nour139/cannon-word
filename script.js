// === (Keep existing variable declarations and utility functions) ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const keyboardContainer = document.getElementById('onscreen-keyboard'); // Get keyboard container

// Sound Elements
const shootSound = document.getElementById('shootSound');
const destroySound = document.getElementById('destroySound');
const gameOverSound = document.getElementById('gameOverSound');

// --- Game Settings (Keep as is) ---
const WIN_SCORE = 1300;
const BASE_SPEED = 0.5;
const SPEED_INCREMENT = 0.05;
const SCORE_MILESTONE = 100;
const CANNON_HEIGHT = 30;
const CANNON_WIDTH = 20;
const BARREL_LENGTH = 30;
const BARREL_WIDTH = 8;
const FALLING_ITEM_FONT = "18px 'Courier New', Courier";
const FRUIT_FONT = "30px Arial";

// --- Game State (Keep as is) ---
let score = 0;
let level = 1;
let gameSpeed = BASE_SPEED;
let isGameOver = false;
let fallingItems = [];
let projectiles = [];
let effects = [];
let lastSpawnTime = 0;
let spawnInterval = 2000;
let animationFrameId; // Store the animation frame ID

// --- Word List & Fruit Data (Keep as is) ---
const wordList = [ /* ... your words ... */ ];
const fruitData = [ /* ... your fruit data ... */ ];

// --- Utility Functions (Keep as is) ---
function random(min, max) { /* ... */ }
function randomInt(min, max) { /* ... */ }
function getRandomWord() { /* ... */ }
function getRandomFruit() { /* ... */ }
function playSound(sound) { /* ... */ }
function triggerScreenShake() { /* ... */ }

// --- Game Objects ---

// Cannon Object (Make sure positioning is correct)
const cannon = {
    x: 0, // Calculated in resizeCanvas
    y: 0, // Calculated in resizeCanvas
    baseWidth: CANNON_WIDTH * 1.5,
    baseHeight: CANNON_HEIGHT * 0.8,
    barrelWidth: BARREL_WIDTH,
    barrelLength: BARREL_LENGTH,
    angle: -Math.PI / 2,
    color: 'hsl(0, 100%, 50%)',
    hue: 0,

    updateColor: function() { /* ... (keep as is) ... */ },

    draw: function(ctx) {
        // Check if position seems valid before drawing
        if (this.x <= 0 || this.y <= 0) {
            // console.warn("Cannon position not set correctly yet?", this.x, this.y);
             return; // Don't draw if position is invalid (e.g., before first resize)
        }
        // console.log("Attempting to draw cannon at:", this.x, this.y); // Debug Log

        this.updateColor();
        const nozzleX = this.x;
        // Ensure nozzleY is relative to the calculated cannon base position (this.y)
        const nozzleY = this.y - this.baseHeight;

        // Draw Base
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.moveTo(this.x - this.baseWidth / 2, this.y);
        ctx.lineTo(this.x + this.baseWidth / 2, this.y);
        ctx.lineTo(this.x + this.baseWidth / 3, nozzleY); // Use nozzleY
        ctx.lineTo(this.x - this.baseWidth / 3, nozzleY); // Use nozzleY
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Barrel
        ctx.save();
        ctx.translate(nozzleX, nozzleY); // Move origin to nozzle base
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.barrelWidth / 2, -this.barrelLength, this.barrelWidth, this.barrelLength);
        ctx.beginPath();
        ctx.arc(0, -this.barrelLength, this.barrelWidth / 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.restore();
    },

    aimAt: function(targetX, targetY) { /* ... (keep as is, check nozzleY calculation) ... */
        const nozzleY = this.y - this.baseHeight;
        const dx = targetX - this.x;
        const dy = targetY - nozzleY;
        this.angle = Math.atan2(dy, dx) + Math.PI / 2;
    },

    getNozzlePosition: function() { /* ... (keep as is, check nozzleBaseY calculation) ... */
        const nozzleBaseX = this.x;
        const nozzleBaseY = this.y - this.baseHeight;
        const nozzleTipX = nozzleBaseX + Math.sin(this.angle) * this.barrelLength;
        const nozzleTipY = nozzleBaseY - Math.cos(this.angle) * this.barrelLength;
        return { x: nozzleTipX, y: nozzleTipY };
    }
};

// FallingItem Class (Keep as is)
class FallingItem { /* ... */ }

// Projectile Class (Keep as is)
class Projectile { /* ... */ }

// DestructionEffect Class (Keep as is)
class DestructionEffect { /* ... */ }


// --- Mobile Input Handling (Keep custom keyboard logic) ---
function simulateKeyPress(key) { /* ... (keep as is) ... */ }

// Add listener for on-screen keyboard taps
// ADDED a check to ensure keyboardContainer exists before adding listener
if (keyboardContainer) {
    keyboardContainer.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.key) {
            e.preventDefault();
            const key = e.target.dataset.key;
            simulateKeyPress(key);
            e.target.classList.add('tapped');
            setTimeout(() => e.target.classList.remove('tapped'), 150);
        }
    });
    keyboardContainer.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'BUTTON') {
            e.preventDefault();
        }
    }, { passive: false });
} else {
    console.warn("Onscreen keyboard container not found!");
}

// --- Audio Initialization (Keep as is) ---
function initAudio() { /* ... */ }


// --- Game Logic Functions (Keep as is) ---
function spawnItem() { /* ... */ }
function handleInput(event) { /* ... */ }
function updateScoreAndLevel() { /* ... */ }
function gameOver() { /* ... */ }
function restartGame() { /* ... */ }

// --- Canvas Resizing (CRITICAL FOR MOBILE FIT & CANNON POSITION) ---
function resizeCanvas() {
    // Set canvas logical size to match its CSS display size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Recalculate cannon position based on NEW canvas dimensions
    cannon.x = canvas.width / 2;
    // Position base slightly above the absolute bottom edge
    cannon.y = canvas.height - 10; // Use a small offset from the bottom

    // Debug logs to verify dimensions and position after resize
    console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
    console.log(`Cannon position set to: x=${cannon.x}, y=${cannon.y}`);

    // Optional: Redraw immediately after resize if needed (usually handled by game loop)
    // if (!isGameOver && ctx) {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    //     // Redraw static elements or entire scene if desired
    //     cannon.draw(ctx);
    // }
}


// --- Game Loop ---
let lastTime = 0; // Moved outside loop function

function gameLoop(timestamp) {
    if (isGameOver) {
        // ... (game over logic)
        return;
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    const deltaTime = (timestamp - lastTime) || 16.67; // Handle initial call
    lastTime = timestamp;
    const dt = Math.min(deltaTime, 50); // Limit delta time

    // 1. Clear Canvas
    // Check if ctx exists, safety measure
    if (!ctx) {
        console.error("Canvas context is not available!");
        cancelAnimationFrame(animationFrameId);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Update ---
    spawnItem();
    fallingItems.forEach(item => item.update(dt));
    projectiles.forEach(proj => proj.update(dt));
    effects.forEach(effect => effect.update(dt));

    // --- Remove marked items ---
    fallingItems = fallingItems.filter(item => !item.markedForDeletion);
    projectiles = projectiles.filter(proj => !proj.markedForDeletion);
    effects = effects.filter(effect => !effect.markedForDeletion);

    // --- Draw ---
    // **** Ensure cannon is drawn ****
    cannon.draw(ctx);

    projectiles.forEach(proj => proj.draw(ctx));
    fallingItems.forEach(item => item.draw(ctx));
    effects.forEach(effect => effect.draw(ctx));
}

// --- Initialization ---
window.addEventListener('resize', resizeCanvas); // Listen for resize events
document.addEventListener('keydown', handleInput); // Physical keyboard
restartButton.addEventListener('click', restartGame);

// Initial Setup
initAudio();
resizeCanvas(); // **** IMPORTANT: Call resizeCanvas ONCE initially ****
updateScoreAndLevel();
lastTime = performance.now(); // Initialize lastTime for first frame calculation
gameLoop(lastTime); // Start the game loop
