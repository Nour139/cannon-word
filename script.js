// === Keep existing Canvas, UI, Sound element references ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level'); // Make sure this is defined
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const keyboardContainer = document.getElementById('onscreen-keyboard');

// === Mode Selection elements ===
const modeSelectionScreen = document.getElementById('modeSelectionScreen');
const desktopModeButton = document.getElementById('desktopModeButton');
const mobileModeButton = document.getElementById('mobileModeButton');

// === Game Mode State ===
let gameMode = null; // 'desktop' or 'mobile'
const MOBILE_KEYBOARD_HEIGHT_ESTIMATE = 180; // Pixels - Adjust if needed
let gameOverLineY = 0;

// --- Game Settings, State, Word List, Fruit Data (Keep as is) ---
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

let score = 0;
let level = 1;
let gameSpeed = BASE_SPEED;
let isGameOver = false;
let fallingItems = [];
let projectiles = [];
let effects = [];
let lastSpawnTime = 0; // Will be initialized in startGame/restartGame
let spawnInterval = 2000;
let animationFrameId;

const wordList = [ /* ... your words ... */ ];
const fruitData = [ /* ... your fruit data ... */ ];
const shootSound = document.getElementById('shootSound');
const destroySound = document.getElementById('destroySound');
const gameOverSound = document.getElementById('gameOverSound');

// --- Utility Functions (Keep as is) ---
function random(min, max) { return Math.random() * (max - min) + min; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getRandomWord() { return wordList[randomInt(0, wordList.length - 1)]; }
function getRandomFruit() { return fruitData[randomInt(0, fruitData.length - 1)]; }
function playSound(sound) { sound.currentTime = 0; sound.play().catch(e => console.log("Sound play failed:", e)); }
function triggerScreenShake() { gameContainer.classList.add('shake'); setTimeout(() => gameContainer.classList.remove('shake'), 200); }

// --- Game Objects ---

// Cannon Object
const cannon = {
    x: 0, y: 0, baseWidth: CANNON_WIDTH * 1.5, baseHeight: CANNON_HEIGHT * 0.8, barrelWidth: BARREL_WIDTH, barrelLength: BARREL_LENGTH, angle: -Math.PI / 2, color: 'hsl(0, 100%, 50%)', hue: 0,
    updateColor: function() { this.hue = (this.hue + 1) % 360; this.color = `hsl(${this.hue}, 100%, 60%)`; },
    draw: function(ctx) {
        // ** Refined Check: Only draw if context exists and position is somewhat valid **
        if (!ctx || this.y <= 0) {
             // console.warn(`Cannon draw skipped. Y position: ${this.y}`); // Optional debug
             return;
        }
        this.updateColor();
        const nozzleX = this.x;
        const nozzleY = this.y - this.baseHeight;
        ctx.fillStyle = '#cccccc'; ctx.beginPath(); ctx.moveTo(this.x - this.baseWidth / 2, this.y); ctx.lineTo(this.x + this.baseWidth / 2, this.y); ctx.lineTo(this.x + this.baseWidth / 3, nozzleY); ctx.lineTo(this.x - this.baseWidth / 3, nozzleY); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#555555'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.translate(nozzleX, nozzleY); ctx.rotate(this.angle); ctx.fillStyle = this.color; ctx.fillRect(-this.barrelWidth / 2, -this.barrelLength, this.barrelWidth, this.barrelLength); ctx.beginPath(); ctx.arc(0, -this.barrelLength, this.barrelWidth / 1.5, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill(); ctx.restore();
    },
    aimAt: function(targetX, targetY) { const nozzleY = this.y - this.baseHeight; const dx = targetX - this.x; const dy = targetY - nozzleY; this.angle = Math.atan2(dy, dx) + Math.PI / 2; },
    getNozzlePosition: function() { const nozzleBaseX = this.x; const nozzleBaseY = this.y - this.baseHeight; const nozzleTipX = nozzleBaseX + Math.sin(this.angle) * this.barrelLength; const nozzleTipY = nozzleBaseY - Math.cos(this.angle) * this.barrelLength; return { x: nozzleTipX, y: nozzleTipY }; }
};

// FallingItem Class (Keep update check for gameOverLineY)
class FallingItem {
    constructor(text, x, y, speed, type = 'letter', shape = null) { this.text = text.toUpperCase(); this.x = x; this.y = y; this.speed = speed; this.type = type; this.shape = shape; this.currentTypedIndex = 0; this.markedForDeletion = false; this.fontSize = (type === 'fruit') ? FRUIT_FONT : FALLING_ITEM_FONT; this.color = `hsl(${randomInt(0, 360)}, 80%, 70%)`; }
    update(deltaTime) {
        this.y += this.speed * gameSpeed * deltaTime * 0.1;
        if (!isGameOver && this.y >= gameOverLineY && gameOverLineY > 0) { // Ensure gameOverLineY is calculated
            console.log(`Item ${this.text} hit line at Y=${this.y} (Line Y=${gameOverLineY})`); // Debug
            this.markedForDeletion = true;
            gameOver(); return;
        }
        if (this.y > canvas.height + 50) { this.markedForDeletion = true; if (!isGameOver) { gameOver(); } }
    }
    draw(ctx) { ctx.font = this.fontSize; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2; if (this.type === 'word' || this.type === 'fruit') { const fullText = this.text; const typedPart = fullText.substring(0, this.currentTypedIndex); const remainingPart = fullText.substring(this.currentTypedIndex); const typedWidth = ctx.measureText(typedPart).width; const totalWidth = ctx.measureText(fullText).width; const startX = this.x - totalWidth / 2; if(this.type === 'fruit' && this.shape) { ctx.fillText(this.shape, this.x, this.y - 20); } ctx.fillStyle = '#FFFFFF'; ctx.fillText(remainingPart, startX + typedWidth + ctx.measureText(remainingPart).width / 2, this.y); ctx.fillStyle = '#FF4444'; ctx.fillText(typedPart, startX + typedWidth / 2, this.y); } else { ctx.fillStyle = '#FFFFFF'; ctx.fillText(this.text, this.x, this.y); } ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
    getNextCharPosition() { ctx.font = this.fontSize; const metrics = ctx.measureText(this.text); const totalWidth = metrics.width; let approxCharWidth = totalWidth / this.text.length || 10; const typedPart = this.text.substring(0, this.currentTypedIndex); const typedWidth = ctx.measureText(typedPart).width; const startX = this.x - totalWidth / 2; const nextCharCenterX = startX + typedWidth + (approxCharWidth / 2); return { x: nextCharCenterX, y: this.y }; }
}

// Projectile Class (Keep as is)
class Projectile { constructor(startX, startY, targetX, targetY, speed = 8) { this.x = startX; this.y = startY; const dx = targetX - startX; const dy = targetY - startY; const distance = Math.sqrt(dx * dx + dy * dy) || 1; this.velocityX = (dx / distance) * speed; this.velocityY = (dy / distance) * speed; this.size = 4; this.color = `hsl(${randomInt(0, 50)}, 100%, 70%)`; this.markedForDeletion = false; this.life = 100; } update(deltaTime) { this.x += this.velocityX * deltaTime * 0.16; this.y += this.velocityY * deltaTime * 0.16; this.life--; if (this.life <= 0 || this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) { this.markedForDeletion = true; } } draw(ctx) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `hsla(${randomInt(0, 50)}, 100%, 70%, 0.5)`; ctx.beginPath(); ctx.arc(this.x - this.velocityX*0.5, this.y - this.velocityY*0.5, this.size * 0.7, 0, Math.PI * 2); ctx.fill(); } }

// DestructionEffect Class (Keep as is)
class DestructionEffect { constructor(x, y, count = 10, color = '#FF0000') { this.particles = []; for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2; const speed = random(1, 5); this.particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: random(2, 5), life: random(20, 40), color: `hsl(${randomInt(0, 360)}, 100%, 70%)` }); } this.markedForDeletion = false; } update(deltaTime) { let allDead = true; this.particles.forEach(p => { if (p.life > 0) { allDead = false; p.x += p.vx * deltaTime * 0.1; p.y += p.vy * deltaTime * 0.1; p.life--; p.size *= 0.98; if (p.size < 0.5) p.life = 0; } }); if (allDead) { this.markedForDeletion = true; } } draw(ctx) { this.particles.forEach(p => { if (p.life > 0) { ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 40; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; } }); } }

// --- Mobile Input Handling ---
function simulateKeyPress(key) { if (isGameOver) return; const upperKey = key.toUpperCase(); if (upperKey.length !== 1 || !/[A-Z]/.test(upperKey)) return; const event = new KeyboardEvent('keydown', { key: upperKey, code: `Key${upperKey}`, bubbles: true, cancelable: true }); document.dispatchEvent(event); }
if (keyboardContainer) { keyboardContainer.addEventListener('click', function(e) { if (e.target.tagName === 'BUTTON' && e.target.dataset.key) { e.preventDefault(); const key = e.target.dataset.key; simulateKeyPress(key); e.target.classList.add('tapped'); setTimeout(() => e.target.classList.remove('tapped'), 150); } }); keyboardContainer.addEventListener('touchstart', function(e) { if (e.target.tagName === 'BUTTON') { e.preventDefault(); } }, { passive: false }); } else { console.warn("Onscreen keyboard container not found!"); }

// --- Audio Initialization ---
function initAudio() { const sounds = [shootSound, destroySound, gameOverSound]; let unlocked = false; const unlock = () => { if (unlocked) return; sounds.forEach(sound => { sound.play().then(() => sound.pause()).catch(() => {}); }); unlocked = true; document.removeEventListener('touchstart', unlock); document.removeEventListener('click', unlock); console.log("Audio Context Unlocked (attempted)"); }; document.addEventListener('touchstart', unlock, { once: true }); document.addEventListener('click', unlock, { once: true }); }

// --- Game Logic Functions ---
function spawnItem() {
    // ** Check if game has started properly **
    if (!gameMode || isGameOver) return;

    const currentTime = Date.now();
    if (currentTime - lastSpawnTime < spawnInterval) return;
    lastSpawnTime = currentTime;
    const x = random(50, canvas.width - 50);
    const y = -20;
    let newItem;
    if (level === 1) { const spawnType = Math.random(); if (spawnType < 0.3) { const letter = String.fromCharCode(randomInt(65, 90)); newItem = new FallingItem(letter, x, y, random(0.8, 1.5), 'letter'); } else { newItem = new FallingItem(getRandomWord(), x, y, random(0.6, 1.2), 'word'); } } else { const fruitInfo = getRandomFruit(); newItem = new FallingItem(fruitInfo.text, x, y, random(0.7, 1.4), 'fruit', fruitInfo.shape); }
    if (newItem) fallingItems.push(newItem);
    spawnInterval = Math.max(500, spawnInterval * 0.995);
}

function handleInput(event) {
    if (isGameOver || !gameMode) return; // Don't handle input if game not running
    const key = event.key.toUpperCase();
    if (key.length !== 1 || !/[A-Z]/.test(key)) return;
    let hit = false; let targetItem = null;
    let potentialTargets = fallingItems.filter(item => item.currentTypedIndex > 0 && !item.markedForDeletion);
    if (potentialTargets.length > 0) { potentialTargets.sort((a, b) => b.y - a.y); targetItem = potentialTargets[0]; if (targetItem.text[targetItem.currentTypedIndex] === key) { hit = true; } }
    if (!hit) { potentialTargets = fallingItems.filter(item => !item.markedForDeletion && item.text.length > 0 && item.text[0] === key && item.currentTypedIndex === 0); if (potentialTargets.length > 0) { potentialTargets.sort((a, b) => b.y - a.y); targetItem = potentialTargets[0]; hit = true; } }
    if (hit && targetItem) { const targetPos = targetItem.getNextCharPosition(); cannon.aimAt(targetPos.x, targetPos.y); const nozzlePos = cannon.getNozzlePosition(); projectiles.push(new Projectile(nozzlePos.x, nozzlePos.y, targetPos.x, targetPos.y)); playSound(shootSound); targetItem.currentTypedIndex++; if (targetItem.currentTypedIndex >= targetItem.text.length) { score += targetItem.text.length * 10; targetItem.markedForDeletion = true; effects.push(new DestructionEffect(targetPos.x, targetPos.y)); playSound(destroySound); triggerScreenShake(); updateScoreAndLevel(); } }
}

function updateScoreAndLevel() { scoreDisplay.textContent = `Score: ${score}`; levelDisplay.textContent = `Level: ${level}`; const speedMilestonesReached = Math.floor(score / SCORE_MILESTONE); gameSpeed = BASE_SPEED + speedMilestonesReached * SPEED_INCREMENT; if (score >= WIN_SCORE && level === 1) { level = 2; levelDisplay.textContent = `Level: ${level}`; console.log("LEVEL 2 REACHED! Fruit time!"); spawnInterval *= 0.8; } }

function gameOver() { if (isGameOver) return; isGameOver = true; playSound(gameOverSound); finalScoreDisplay.textContent = score; gameOverScreen.style.display = 'flex'; console.log("Game Over!"); if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; } } // Clear animation frame

function restartGame() {
    score = 0; level = 1; gameSpeed = BASE_SPEED; isGameOver = false; fallingItems = []; projectiles = []; effects = []; cannon.angle = -Math.PI / 2; spawnInterval = 2000;
    gameOverScreen.style.display = 'none';
    if (gameMode === 'mobile' && keyboardContainer) { keyboardContainer.style.display = 'flex'; }
    updateScoreAndLevel();
    // ** Re-initialize lastSpawnTime for the new game **
    lastSpawnTime = Date.now();
    // Restart the loop
    lastTime = performance.now(); // Reset lastTime for delta calculation
    if (!animationFrameId) { // Only start loop if it's not already running (safety)
       gameLoop(lastTime);
    }
}

// --- Canvas Resizing ---
function resizeCanvas() {
    if (!canvas || !cannon || !ctx) return; // Safety checks
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    cannon.x = canvas.width / 2;
    let calculatedCannonY;
    if (gameMode === 'mobile') {
        // Estimate keyboard height relative to screen height for better scaling
        const estimatedKeyboardHeight = Math.min(MOBILE_KEYBOARD_HEIGHT_ESTIMATE, canvas.height * 0.3); // Limit to 30% of screen
        calculatedCannonY = canvas.height - estimatedKeyboardHeight - 15; // 15px offset
    } else { // Desktop mode
        calculatedCannonY = canvas.height - 15; // 15px offset
    }
    // Ensure cannon doesn't go off-screen if calculations are weird
    cannon.y = Math.max(cannon.baseHeight, calculatedCannonY);

    gameOverLineY = cannon.y - cannon.baseHeight - 5; // 5px buffer above base

    console.log(`Canvas resized: ${canvas.width}x${canvas.height}, Mode: ${gameMode}, Cannon Pos: (${cannon.x.toFixed(1)}, ${cannon.y.toFixed(1)}), GameOver Line: ${gameOverLineY.toFixed(1)}`);

    // Immediate redraw after resize ONLY if the game is running
    if (gameMode && !isGameOver) {
        // Clear and redraw essential elements quickly
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cannon.draw(ctx);
        // Optionally redraw projectiles/items if needed for smoothness
        // projectiles.forEach(proj => proj.draw(ctx));
        // fallingItems.forEach(item => item.draw(ctx));
    }
}


// --- Game Loop ---
let lastTime = 0;
function gameLoop(timestamp) {
    if (isGameOver || !gameMode) { // Added !gameMode check
        animationFrameId = null; // Ensure it stops if mode changes or game over
        return;
    }
    animationFrameId = requestAnimationFrame(gameLoop);
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    const dt = Math.min(deltaTime || 16.67, 50);

    if (!ctx) { console.error("Canvas context lost!"); cancelAnimationFrame(animationFrameId); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update phase
    spawnItem(); // Now relies on initialized lastSpawnTime
    fallingItems.forEach(item => item.update(dt));
    projectiles.forEach(proj => proj.update(dt));
    effects.forEach(effect => effect.update(dt));

    // Remove phase
    fallingItems = fallingItems.filter(item => !item.markedForDeletion);
    projectiles = projectiles.filter(proj => !proj.markedForDeletion);
    effects = effects.filter(effect => !effect.markedForDeletion);

    // Draw phase
    cannon.draw(ctx); // Should draw now if y > 0
    projectiles.forEach(proj => proj.draw(ctx));
    fallingItems.forEach(item => item.draw(ctx));
    effects.forEach(effect => effect.draw(ctx));
}

// --- Mode Selection and Game Start ---
function selectMode(mode) {
    if (mode !== 'desktop' && mode !== 'mobile') return;
    gameMode = mode;
    console.log("Selected Mode:", gameMode);

    if (modeSelectionScreen) modeSelectionScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'block';

    // ** IMPORTANT: Add/Remove class AFTER showing container potentially **
    // This ensures the keyboard shows up correctly if needed
    if (gameMode === 'mobile') {
        document.body.classList.add('mobile-mode-active');
        if(keyboardContainer) keyboardContainer.style.display = 'flex'; // Explicitly show
    } else {
        document.body.classList.remove('mobile-mode-active');
        if(keyboardContainer) keyboardContainer.style.display = 'none'; // Explicitly hide
    }

    startGame(); // Start the game initialization
}

function startGame() {
    console.log("Starting game initialization...");
    isGameOver = false; // Ensure game isn't over from previous state
    score = 0; // Reset score
    level = 1; // Reset level
    fallingItems = []; // Clear items
    projectiles = []; // Clear projectiles
    effects = []; // Clear effects

    initAudio(); // Initialize audio context
    resizeCanvas(); // ** CRITICAL: Set initial size and cannon position **
    updateScoreAndLevel(); // Update UI display

    // ** CRITICAL: Initialize lastSpawnTime here **
    lastSpawnTime = Date.now();
    spawnInterval = 2000; // Reset spawn interval

    // Clear any existing animation frame before starting a new one
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    lastTime = performance.now(); // Reset timer for game loop
    gameLoop(lastTime); // Start the main game loop
     console.log("Game loop initiated.");
}

// --- Global Event Listeners Setup ---
window.addEventListener('resize', resizeCanvas);
document.addEventListener('keydown', handleInput);
restartButton.addEventListener('click', restartGame);

// Mode selection button listeners
if (desktopModeButton && mobileModeButton && modeSelectionScreen) {
    desktopModeButton.addEventListener('click', () => selectMode('desktop'));
    mobileModeButton.addEventListener('click', () => selectMode('mobile'));
} else {
    console.error("Mode selection buttons or screen not found!");
    // Optional fallback: Start in desktop mode if buttons missing
    // setTimeout(() => selectMode('desktop'), 100);
}

// --- Initial Page Load ---
// Game does NOT start automatically. Waits for mode selection.
console.log("Page loaded. Waiting for mode selection.");
// Ensure game container is hidden initially if not done by CSS already
if (gameContainer) gameContainer.style.display = 'none';
if (modeSelectionScreen) modeSelectionScreen.style.display = 'flex'; // Ensure selection is visible
