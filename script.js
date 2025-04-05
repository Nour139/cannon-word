const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// Sound Elements
const shootSound = document.getElementById('shootSound');
const destroySound = document.getElementById('destroySound');
const gameOverSound = document.getElementById('gameOverSound');

// --- Game Settings ---
const WIN_SCORE = 1300;
const BASE_SPEED = 0.5; // Initial speed multiplier
const SPEED_INCREMENT = 0.05; // How much speed increases per score milestone
const SCORE_MILESTONE = 100; // Increase speed every X points
const CANNON_HEIGHT = 30;
const CANNON_WIDTH = 20;
const BARREL_LENGTH = 30;
const BARREL_WIDTH = 8;
const FALLING_ITEM_FONT = "18px 'Courier New', Courier";
const FRUIT_FONT = "30px Arial"; // Font for fruit shapes

// --- Game State ---
let score = 0;
let level = 1;
let gameSpeed = BASE_SPEED;
let isGameOver = false;
let fallingItems = [];
let projectiles = [];
let effects = []; // For destruction effects
let cannonAngle = 0;
let lastSpawnTime = 0;
let spawnInterval = 2000; // Initial spawn rate in ms
let cannonColor = 'hsl(0, 100%, 50%)'; // Initial cannon color (red)
let cannonColorHue = 0; // For cycling color

// --- Word List (Add MANY more words!) ---
const wordList = [
    "CODE", "GAME", "HTML", "CSS", "JAVA", "SCRIPT", "TYPE", "FAST", "PIXEL", "VECTOR",
    "CYBER", "PUNK", "LASER", "BLAST", "SCORE", "LEVEL", "VOID", "MATRIX", "GLITCH",
    "INPUT", "OUTPUT", "ARRAY", "LOOP", "CLASS", "OBJECT", "RENDER", "FRAME", "DEBUG",
    "ERROR", "CACHE", "PROXY", "SERVER", "CLIENT", "CLOUD", "BINARY", "HEX", "NODE",
    "REACT", "ANGULAR", "VUE", "PYTHON", "RUBY", "PERL", "SWIFT", "KOTLIN", "RUST",
    "SYSTEM", "KERNEL", "SHELL", "QUERY", "INDEX", "TABLE", "FLOAT", "INTEGER", "STRING",
    "BOOLEAN", "NULL", "ASYNC", "AWAIT", "PROMISE", "FETCH", "AJAX", "JSON", "XML",
    "SOCKET", "STREAM", "BUFFER", "STACK", "QUEUE", "HEAP", "TREE", "GRAPH", "ALGORITHM"
    // Add hundreds or thousands more for 'unlimited' feel
];

const fruitData = [ // Text to type and the shape to draw
    { text: "APPLE", shape: "🍎" },
    { text: "BANANA", shape: "🍌" },
    { text: "GRAPE", shape: "🍇" },
    { text: "ORANGE", shape: "🍊" },
    { text: "PEAR", shape: "🍐" },
    { text: "CHERRY", shape: "🍒" },
    { text: "LEMON", shape: "🍋" },
    { text: "WATERMELON", shape: "🍉" },
];

// --- Utility Functions ---
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomWord() {
    return wordList[randomInt(0, wordList.length - 1)];
}

function getRandomFruit() {
    return fruitData[randomInt(0, fruitData.length - 1)];
}

function playSound(sound) {
    sound.currentTime = 0; // Rewind to start
    sound.play().catch(e => console.log("Sound play failed:", e)); // Handle potential browser restrictions
}

function triggerScreenShake() {
    gameContainer.classList.add('shake');
    setTimeout(() => gameContainer.classList.remove('shake'), 200); // Duration matches CSS
}

// --- Game Objects ---

// Cannon Object (simplified)
const cannon = {
    x: 0, // Will be set to canvas center
    y: 0, // Will be set to canvas bottom
    baseWidth: CANNON_WIDTH * 1.5,
    baseHeight: CANNON_HEIGHT * 0.8,
    barrelWidth: BARREL_WIDTH,
    barrelLength: BARREL_LENGTH,
    angle: -Math.PI / 2, // Pointing straight up initially
    color: 'hsl(0, 100%, 50%)',
    hue: 0,

    updateColor: function() {
        this.hue = (this.hue + 1) % 360; // Cycle through hues
        this.color = `hsl(${this.hue}, 100%, 60%)`;
    },

    draw: function(ctx) {
        this.updateColor();
        const nozzleX = this.x;
        const nozzleY = this.y - this.baseHeight;

        // Draw Base (simple trapezoid)
        ctx.fillStyle = '#cccccc'; // Metallic grey base
        ctx.beginPath();
        ctx.moveTo(this.x - this.baseWidth / 2, this.y);
        ctx.lineTo(this.x + this.baseWidth / 2, this.y);
        ctx.lineTo(this.x + this.baseWidth / 3, this.y - this.baseHeight);
        ctx.lineTo(this.x - this.baseWidth / 3, this.y - this.baseHeight);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        ctx.stroke();


        // Draw Barrel (rotated)
        ctx.save(); // Save context state
        ctx.translate(nozzleX, nozzleY); // Move origin to nozzle base
        ctx.rotate(this.angle); // Rotate
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.barrelWidth / 2, -this.barrelLength, this.barrelWidth, this.barrelLength); // Draw barrel pointing up from origin
         // Draw a small circle at the tip for effect
        ctx.beginPath();
        ctx.arc(0, -this.barrelLength, this.barrelWidth / 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.restore(); // Restore context state
    },

    aimAt: function(targetX, targetY) {
        const nozzleX = this.x;
        const nozzleY = this.y - this.baseHeight; // Actual pivot point
        const dx = targetX - nozzleX;
        const dy = targetY - nozzleY;
        this.angle = Math.atan2(dy, dx) + Math.PI / 2; // Add PI/2 because 0 angle is right, we want it up
    },

    getNozzlePosition: function() {
         const nozzleBaseX = this.x;
         const nozzleBaseY = this.y - this.baseHeight;
         // Calculate tip position based on angle and length
         const nozzleTipX = nozzleBaseX + Math.sin(this.angle) * this.barrelLength;
         const nozzleTipY = nozzleBaseY - Math.cos(this.angle) * this.barrelLength;
         return { x: nozzleTipX, y: nozzleTipY };
    }
};

class FallingItem {
    constructor(text, x, y, speed, type = 'letter', shape = null) {
        this.text = text.toUpperCase(); // Ensure consistency
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.type = type; // 'letter', 'word', 'fruit'
        this.shape = shape; // For fruit
        this.currentTypedIndex = 0; // For words/fruits
        this.markedForDeletion = false;
        this.fontSize = (type === 'fruit') ? FRUIT_FONT : FALLING_ITEM_FONT;
        this.color = `hsl(${randomInt(0, 360)}, 80%, 70%)`; // Random bright color for item
    }

    update(deltaTime) {
        this.y += this.speed * gameSpeed * deltaTime * 0.1; // Adjust multiplier as needed
        if (this.y > canvas.height + 50) { // Check if off-screen (bottom)
            this.markedForDeletion = true;
            if (!isGameOver) { // Only trigger game over once
                 gameOver();
            }
        }
    }

    draw(ctx) {
        ctx.font = this.fontSize;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Add a slight shadow/outline for visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;


        if (this.type === 'word' || this.type === 'fruit') {
            // Draw typed part in different color (e.g., red)
            const fullText = this.text;
            const typedPart = fullText.substring(0, this.currentTypedIndex);
            const remainingPart = fullText.substring(this.currentTypedIndex);
            const typedWidth = ctx.measureText(typedPart).width;
            const totalWidth = ctx.measureText(fullText).width;
            const startX = this.x - totalWidth / 2;

            if(this.type === 'fruit' && this.shape) {
                 ctx.fillText(this.shape, this.x, this.y - 20); // Draw shape above text
            }

            // Draw remaining part (white)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(remainingPart, startX + typedWidth + ctx.measureText(remainingPart).width / 2, this.y);

             // Draw typed part (red)
            ctx.fillStyle = '#FF4444'; // More intense red
            ctx.fillText(typedPart, startX + typedWidth / 2, this.y);


        } else { // Single letter
             ctx.fillStyle = '#FFFFFF';
             ctx.fillText(this.text, this.x, this.y);
        }
         // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

    }

    // Method to get the position of the *next* character to be typed
    getNextCharPosition() {
        ctx.font = this.fontSize; // Ensure correct font for measurement
        const metrics = ctx.measureText(this.text); // Measure the whole word
        const totalWidth = metrics.width;
        let approxCharWidth = totalWidth / this.text.length;
        if (this.text.length === 0) approxCharWidth = 0; // Avoid division by zero

        // Calculate width of the part already typed
        const typedPart = this.text.substring(0, this.currentTypedIndex);
        const typedWidth = ctx.measureText(typedPart).width;

        // Estimate the center X of the next character
        const startX = this.x - totalWidth / 2;
        const nextCharCenterX = startX + typedWidth + (approxCharWidth / 2);

        return { x: nextCharCenterX, y: this.y };
    }
}

class Projectile {
    constructor(startX, startY, targetX, targetY, speed = 8) {
        this.x = startX;
        this.y = startY;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
        this.velocityX = (dx / distance) * speed;
        this.velocityY = (dy / distance) * speed;
        this.size = 4;
        this.color = `hsl(${randomInt(0, 50)}, 100%, 70%)`; // Reds/Oranges/Yellows
        this.markedForDeletion = false;
        this.life = 100; // Frames to live
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime * 0.16; // Adjust multiplier for speed
        this.y += this.velocityY * deltaTime * 0.16;
        this.life--;
        if (this.life <= 0 || this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) { // Allow going slightly offscreen
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        // Add a trail effect
        ctx.fillStyle = `hsla(${randomInt(0, 50)}, 100%, 70%, 0.5)`;
        ctx.beginPath();
        ctx.arc(this.x - this.velocityX*0.5, this.y - this.velocityY*0.5, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

class DestructionEffect {
    constructor(x, y, count = 10, color = '#FF0000') {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(1, 5);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: random(2, 5),
                life: random(20, 40), // Frames
                color: `hsl(${randomInt(0, 360)}, 100%, 70%)` // Random bright color
            });
        }
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        let allDead = true;
        this.particles.forEach(p => {
            if (p.life > 0) {
                allDead = false;
                p.x += p.vx * deltaTime * 0.1;
                p.y += p.vy * deltaTime * 0.1;
                p.life--;
                p.size *= 0.98; // Shrink
                 if (p.size < 0.5) p.life = 0; // Mark as dead if too small
            }
        });
        if (allDead) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            if (p.life > 0) {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 40; // Fade out
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                 ctx.globalAlpha = 1.0; // Reset alpha
            }
        });
    }
}


// --- Mobile Input Handling ---
const keyboardContainer = document.getElementById('onscreen-keyboard');

// Function to simulate a keydown event for the on-screen keyboard
function simulateKeyPress(key) {
    if (isGameOver) return; // Don't simulate if game is over
    const upperKey = key.toUpperCase();
    if (upperKey.length !== 1 || !/[A-Z]/.test(upperKey)) return;

    // Create and dispatch event that handleInput can understand
    const event = new KeyboardEvent('keydown', {
        key: upperKey,
        code: `Key${upperKey}`,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
}

// Add listener for on-screen keyboard taps (using event delegation)
if (keyboardContainer) {
    keyboardContainer.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.key) {
             e.preventDefault(); // Prevent default button behavior
            const key = e.target.dataset.key;
            simulateKeyPress(key);
            // Optional visual feedback
            e.target.classList.add('tapped');
            setTimeout(() => e.target.classList.remove('tapped'), 150);
        }
    });
    // Prevent accidental page zoom on double-tap within the keyboard area
    keyboardContainer.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'BUTTON') {
            e.preventDefault();
        }
    }, { passive: false });
}

// Function to unlock audio context on mobile after user interaction
function initAudio() {
  const sounds = [shootSound, destroySound, gameOverSound];
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    sounds.forEach(sound => {
      // Try playing and pausing silently to unlock
      sound.play().then(() => sound.pause()).catch(() => {});
    });
    unlocked = true;
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('click', unlock);
    console.log("Audio Context Unlocked (attempted)");
  };
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('click', unlock, { once: true });
}


// --- Game Logic Functions ---

function spawnItem() {
    const currentTime = Date.now();
    if (currentTime - lastSpawnTime < spawnInterval) return; // Limit spawn rate

    lastSpawnTime = currentTime;
    const x = random(50, canvas.width - 50); // Avoid edges
    const y = -20; // Start above screen
    let newItem;

    if (level === 1) {
         const spawnType = Math.random();
        if (spawnType < 0.3) { // 30% chance for single letter
             const letter = String.fromCharCode(randomInt(65, 90)); // Random uppercase letter
             newItem = new FallingItem(letter, x, y, random(0.8, 1.5), 'letter');
        } else { // 70% chance for word
             newItem = new FallingItem(getRandomWord(), x, y, random(0.6, 1.2), 'word');
        }
    } else { // Level 2+
        const fruitInfo = getRandomFruit();
        newItem = new FallingItem(fruitInfo.text, x, y, random(0.7, 1.4), 'fruit', fruitInfo.shape);
    }


    fallingItems.push(newItem);

     // Decrease spawn interval slightly over time to increase difficulty
    spawnInterval = Math.max(500, spawnInterval * 0.995);
}

// Main input handler for both physical and simulated key presses
function handleInput(event) {
    if (isGameOver) return;

    const key = event.key.toUpperCase();
    if (key.length !== 1 || !/[A-Z]/.test(key)) return; // Only handle single uppercase letters

    let hit = false;
    let targetItem = null; // The item we are currently targeting

    // Prioritize targeting items already being typed
    let potentialTargets = fallingItems.filter(item => item.currentTypedIndex > 0 && !item.markedForDeletion);
    if (potentialTargets.length > 0) {
        potentialTargets.sort((a, b) => b.y - a.y); // Target lowest one
        targetItem = potentialTargets[0];
        if (targetItem.text[targetItem.currentTypedIndex] === key) {
             hit = true;
        }
    }

    // If no active target or wrong key for active target, check others
    if (!hit) {
        potentialTargets = fallingItems.filter(item =>
            !item.markedForDeletion &&
            item.text.length > 0 && // Ensure item has text
            item.text[0] === key &&
            item.currentTypedIndex === 0 // Only target if not already started
        );

        if (potentialTargets.length > 0) {
            potentialTargets.sort((a, b) => b.y - a.y); // Target lowest one
            targetItem = potentialTargets[0];
            hit = true;
        }
    }


    if (hit && targetItem) {
        // Aim cannon at the *next* character's position before processing hit
        const targetPos = targetItem.getNextCharPosition();
        cannon.aimAt(targetPos.x, targetPos.y);

        // Create projectile
        const nozzlePos = cannon.getNozzlePosition();
        projectiles.push(new Projectile(nozzlePos.x, nozzlePos.y, targetPos.x, targetPos.y));
        playSound(shootSound);

        targetItem.currentTypedIndex++;

        // Check if item is completed
        if (targetItem.currentTypedIndex >= targetItem.text.length) {
            score += targetItem.text.length * 10; // Score based on length
            targetItem.markedForDeletion = true;
            // Use the calculated targetPos for the effect, as it's the last known character position
            effects.push(new DestructionEffect(targetPos.x, targetPos.y));
            playSound(destroySound);
            triggerScreenShake();
            updateScoreAndLevel();
        }
    }
}


function updateScoreAndLevel() {
    scoreDisplay.textContent = `Score: ${score}`;

    // Increase speed based on score milestones
    const speedMilestonesReached = Math.floor(score / SCORE_MILESTONE);
    gameSpeed = BASE_SPEED + speedMilestonesReached * SPEED_INCREMENT;

    // Check for level up
    if (score >= WIN_SCORE && level === 1) {
        level = 2;
        levelDisplay.textContent = `Level: ${level}`;
        console.log("LEVEL 2 REACHED! Fruit time!");
        spawnInterval *= 0.8; // Spawn fruits a bit faster initially
    }
}


function gameOver() {
    if (isGameOver) return; // Prevent multiple triggers
    isGameOver = true;
    playSound(gameOverSound);
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex'; // Show the game over screen
    console.log("Game Over!");
    // Stop animation loop potentially here if not handled by isGameOver flag in loop
     if (animationFrameId) {
         cancelAnimationFrame(animationFrameId);
     }
}

function restartGame() {
    score = 0;
    level = 1;
    gameSpeed = BASE_SPEED;
    isGameOver = false;
    fallingItems = [];
    projectiles = [];
    effects = [];
    cannon.angle = -Math.PI / 2; // Reset cannon aim
    spawnInterval = 2000; // Reset spawn rate
    lastSpawnTime = Date.now(); // Reset spawn timer

    gameOverScreen.style.display = 'none';
    updateScoreAndLevel(); // Reset UI display
    gameLoop(0); // Start the loop again
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recalculate cannon position
    cannon.x = canvas.width / 2;
    cannon.y = canvas.height - 5; // Slightly above bottom edge
}

// --- Game Loop ---
let lastTime = 0;
let animationFrameId; // Store the request ID

function gameLoop(timestamp) {
    if (isGameOver) {
         // If game over, ensure loop doesn't continue unnecessarily
         // Draw final faded state maybe?
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

     animationFrameId = requestAnimationFrame(gameLoop); // Request next frame

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Limit deltaTime to prevent huge jumps if tab loses focus
    const dt = Math.min(deltaTime || 16.67, 50); // Max 50ms step


    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Update ---
    spawnItem(); // Attempt to spawn new items

    // Update falling items
    fallingItems.forEach(item => item.update(dt));

    // Update projectiles
    projectiles.forEach(proj => proj.update(dt));

    // Update effects
    effects.forEach(effect => effect.update(dt));


    // --- Remove marked items ---
    fallingItems = fallingItems.filter(item => !item.markedForDeletion);
    projectiles = projectiles.filter(proj => !proj.markedForDeletion);
    effects = effects.filter(effect => !effect.markedForDeletion);


    // --- Draw ---
    // Draw cannon
    cannon.draw(ctx);

    // Draw projectiles
    projectiles.forEach(proj => proj.draw(ctx));

    // Draw falling items
    fallingItems.forEach(item => item.draw(ctx));

     // Draw effects
    effects.forEach(effect => effect.draw(ctx));
}

// --- Initialization ---
window.addEventListener('resize', resizeCanvas);
document.addEventListener('keydown', handleInput); // Physical keyboard listener
restartButton.addEventListener('click', restartGame);

// Initial setup
initAudio(); // Prepare audio context for mobile
resizeCanvas(); // Set initial size and cannon position
updateScoreAndLevel(); // Set initial UI
lastSpawnTime = Date.now();
gameLoop(0); // Start the game!
