// === Keep existing Canvas, UI, Sound element references ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const scoreDisplay = document.getElementById('score');
// ... (other UI refs)
const keyboardContainer = document.getElementById('onscreen-keyboard');

// === ADD Mode Selection elements ===
const modeSelectionScreen = document.getElementById('modeSelectionScreen');
const desktopModeButton = document.getElementById('desktopModeButton');
const mobileModeButton = document.getElementById('mobileModeButton');

// === ADD Game Mode State ===
let gameMode = null; // 'desktop' or 'mobile'
const MOBILE_KEYBOARD_HEIGHT_ESTIMATE = 180; // Pixels - Adjust based on testing!
let gameOverLineY = 0; // Y-coordinate for game over check

// --- Game Settings, State, Word List, Fruit Data (Keep as is) ---
// ... (WIN_SCORE, BASE_SPEED, score, level, wordList, etc.) ...

// --- Utility Functions (Keep as is) ---
// ... (random, randomInt, playSound, etc.) ...

// --- Game Objects ---

// Cannon Object (Positioning handled in resizeCanvas)
const cannon = {
    // ... (Keep properties like baseWidth, baseHeight, barrelWidth, etc.) ...
    x: 0,
    y: 0, // Will be set by resizeCanvas based on gameMode
    angle: -Math.PI / 2,
    color: 'hsl(0, 100%, 50%)',
    hue: 0,
    updateColor: function() { /* ... */ },
    draw: function(ctx) { /* ... (Keep draw logic, ensure it uses this.x, this.y) ... */ },
    aimAt: function(targetX, targetY) { /* ... (Keep aim logic) ... */ },
    getNozzlePosition: function() { /* ... (Keep nozzle logic) ... */ }
};

// FallingItem Class (Modify update for game over line)
class FallingItem {
    constructor(text, x, y, speed, type = 'letter', shape = null) {
        // ... (Keep existing constructor logic) ...
         this.text = text.toUpperCase(); this.x = x; this.y = y; this.speed = speed; this.type = type; this.shape = shape; this.currentTypedIndex = 0; this.markedForDeletion = false; this.fontSize = (type === 'fruit') ? FRUIT_FONT : FALLING_ITEM_FONT; this.color = `hsl(${randomInt(0, 360)}, 80%, 70%)`;
    }

    update(deltaTime) {
        this.y += this.speed * gameSpeed * deltaTime * 0.1;

        // **** ADD Game Over check for hitting cannon line ****
        // Check if the center of the item reaches the line
        if (!isGameOver && this.y >= gameOverLineY) {
            console.log("Item hit game over line:", this.text, this.y, gameOverLineY);
            this.markedForDeletion = true; // Mark for deletion
             // Don't score points for hitting the line
            gameOver(); // Trigger game over immediately
            return; // Stop further updates for this item this frame
        }
        // *****************************************************

        // Original Game Over check for going off bottom of screen
        if (this.y > canvas.height + 50) {
            this.markedForDeletion = true;
            if (!isGameOver) {
                gameOver();
            }
        }
    }

    draw(ctx) { /* ... (Keep existing draw logic) ... */ }
    getNextCharPosition() { /* ... (Keep existing logic) ... */ }
}

// Projectile Class (Keep as is)
class Projectile { /* ... */ }

// DestructionEffect Class (Keep as is)
class DestructionEffect { /* ... */ }


// --- Mobile Input Handling (Keep custom keyboard logic) ---
function simulateKeyPress(key) { /* ... */ }
if (keyboardContainer) { /* ... (Keep existing event listeners) ... */ }

// --- Audio Initialization (Keep as is) ---
function initAudio() { /* ... */ }


// --- Game Logic Functions ---
function spawnItem() { /* ... (Keep as is) ... */ }
function handleInput(event) { /* ... (Keep as is) ... */ }
function updateScoreAndLevel() { /* ... (Keep as is) ... */ }

// Modify gameOver to potentially reset mode choice later if needed
function gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    playSound(gameOverSound);
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex';
    console.log("Game Over!");
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // Consider hiding the on-screen keyboard on game over
    if(gameMode === 'mobile' && keyboardContainer) {
       // Optional: Hide keyboard immediately or fade out
       // keyboardContainer.style.display = 'none';
    }
}

// Modify restartGame to hide game over screen and restart loop
function restartGame() {
    // Reset game state variables
    score = 0;
    level = 1;
    gameSpeed = BASE_SPEED;
    isGameOver = false;
    fallingItems = [];
    projectiles = [];
    effects = [];
    cannon.angle = -Math.PI / 2;
    spawnInterval = 2000;
    lastSpawnTime = Date.now();

    // Hide game over screen
    gameOverScreen.style.display = 'none';

    // Ensure keyboard is visible if in mobile mode
    if(gameMode === 'mobile' && keyboardContainer) {
       keyboardContainer.style.display = 'flex'; // Ensure it's back
    }


    // Update UI
    updateScoreAndLevel();

    // Restart the game loop
    // No need to call resizeCanvas here unless window size changed during game over
    lastTime = performance.now();
    gameLoop(lastTime);
}

// --- Canvas Resizing (Modify for Mode) ---
function resizeCanvas() {
    if (!canvas || !cannon) return; // Safety check

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Recalculate cannon position based on gameMode
    cannon.x = canvas.width / 2;
    if (gameMode === 'mobile') {
        // Position cannon base above the estimated keyboard area
        cannon.y = canvas.height - MOBILE_KEYBOARD_HEIGHT_ESTIMATE - 10; // 10px offset above keyboard
        console.log(`Resize (Mobile): Cannon Y set to ${cannon.y}`);
    } else { // Desktop mode (or default if mode not set yet, though it should be)
        cannon.y = canvas.height - 10; // Position near bottom
         console.log(`Resize (Desktop): Cannon Y set to ${cannon.y}`);
    }

     // **** Calculate the Game Over Line based on cannon position ****
     // Slightly above the cannon's pivot point (baseHeight below cannon.y)
     gameOverLineY = cannon.y - cannon.baseHeight - 5; // 5px buffer
     console.log(`Game Over line Y set to: ${gameOverLineY}`);
     // ***********************************************************

    // Optional redraw (usually handled by loop)
}


// --- Game Loop (Keep as is) ---
let lastTime = 0;
function gameLoop(timestamp) { /* ... (Keep existing loop logic) ... */ }


// --- Mode Selection and Game Start ---

function selectMode(mode) {
    if (mode !== 'desktop' && mode !== 'mobile') {
        console.error("Invalid game mode selected:", mode);
        return;
    }
    gameMode = mode;
    console.log("Game mode selected:", gameMode);

    // Hide selection screen, show game container
    if (modeSelectionScreen) modeSelectionScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'block'; // Show the game area

    // Add class to body/container if mobile for CSS hook
    if (gameMode === 'mobile') {
        document.body.classList.add('mobile-mode-active');
    } else {
        document.body.classList.remove('mobile-mode-active');
    }

    // Now initialize and start the game
    startGame();
}

function startGame() {
    console.log("Starting game...");
    initAudio();
    resizeCanvas(); // Set initial canvas size and cannon position BASED ON MODE
    updateScoreAndLevel();
    lastTime = performance.now();
    if (animationFrameId) cancelAnimationFrame(animationFrameId); // Clear any previous loop
    gameLoop(lastTime); // Start the main game loop
}

// --- Initialization ---
// Add listeners for mode selection buttons
if (desktopModeButton && mobileModeButton) {
    desktopModeButton.addEventListener('click', () => selectMode('desktop'));
    mobileModeButton.addEventListener('click', () => selectMode('mobile'));
} else {
    console.error("Mode selection buttons not found!");
    // Fallback or error handling? Maybe default to desktop?
    // selectMode('desktop'); // Example fallback
}

// Event listeners that should ONLY be active once game starts
window.addEventListener('resize', resizeCanvas); // Resize should work regardless of start? Maybe move inside startGame? No, keep global.
document.addEventListener('keydown', handleInput); // Physical keyboard - always listen? Yes.
restartButton.addEventListener('click', restartGame); // Game Over screen button

// DO NOT start the game loop here anymore. It starts via selectMode -> startGame.
// initAudio(); // Moved to startGame
// resizeCanvas(); // Moved to startGame
// updateScoreAndLevel(); // Moved to startGame
// gameLoop(0); // Moved to startGame
