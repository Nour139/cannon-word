// === Canvas, UI, Sound element references ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
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

// --- Game Settings, State ---
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
let lastSpawnTime = 0;
let spawnInterval = 2000;
let animationFrameId;

// --- Word List ---
// **** IMPORTANT: For an "unlimited" feel, you MUST add THOUSANDS of words here! ****
// Find common English word lists online and paste them into this array.
// Keep words relatively short/medium length for better gameplay. All uppercase recommended.
const wordList = [
    "CODE", "GAME", "HTML", "CSS", "JAVA", "SCRIPT", "TYPE", "FAST", "PIXEL", "VECTOR",
    "CYBER", "PUNK", "LASER", "BLAST", "SCORE", "LEVEL", "VOID", "MATRIX", "GLITCH",
    "INPUT", "OUTPUT", "ARRAY", "LOOP", "CLASS", "OBJECT", "RENDER", "FRAME", "DEBUG",
    "ERROR", "CACHE", "PROXY", "SERVER", "CLIENT", "CLOUD", "BINARY", "HEX", "NODE",
    "REACT", "ANGULAR", "VUE", "PYTHON", "RUBY", "PERL", "SWIFT", "KOTLIN", "RUST",
    "SYSTEM", "KERNEL", "SHELL", "QUERY", "INDEX", "TABLE", "FLOAT", "INTEGER", "STRING",
    "BOOLEAN", "NULL", "ASYNC", "AWAIT", "PROMISE", "FETCH", "AJAX", "JSON", "XML",
    "SOCKET", "STREAM", "BUFFER", "STACK", "QUEUE", "HEAP", "TREE", "GRAPH", "ALGORITHM",
    // Add MANY MORE words below this line
    "ABILITY", "ABOUT", "ABOVE", "ACCEPT", "ACTION", "ACTIVE", "ACTOR", "ADMIN", "ADOPT",
    "ADULT", "AFTER", "AGAIN", "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT",
    "ALIEN", "ALIGN", "ALIKE", "ALIVE", "ALLOW", "ALONE", "ALONG", "ALPHA", "ALTER",
    "ALWAYS", "AMONG", "AMOUNT", "ANALOG", "ANGLE", "ANGRY", "ANIMAL", "ANNUAL", "ANSWER",
    "APPLE", "APPLY", "APPROVE", "AREA", "ARGUE", "ARISE", "ARMED", "ARMY", "ARROW",
    "ARTIST", "ASIDE", "ASLEEP", "ASSET", "ASSIST", "ASSUME", "ATTACK", "ATTEND", "AUDIO",
    "AUDIT", "AUTHOR", "AUTO", "AVOID", "AWAKE", "AWARD", "AWFUL", "BABY", "BACK", "BACKGROUND",
    "BADGE", "BAKER", "BALANCE", "BALL", "BAND", "BANK", "BARRIER", "BASE", "BASIC",
    "BASIS", "BASKET", "BATTLE", "BEACH", "BEAM", "BEAR", "BEAST", "BEAT", "BEAUTY",
    "BECOME", "BEEN", "BEFORE", "BEGIN", "BEHAVE", "BEHIND", "BELIEF", "BELOW", "BENCH",
    "BESIDE", "BEST", "BETA", "BETTER", "BEYOND", "BIBLE", "BICYCLE", "BILL", "BINARY",
    "BIND", "BIOLOGY", "BIRD", "BIRTH", "BISHOP", "BITE", "BLACK", "BLADE", "BLAME",
    "BLANK", "BLAST", "BLEND", "BLESS", "BLIND", "BLOCK", "BLOOD", "BLOW", "BLUE",
    "BOARD", "BOAT", "BODY", "BOMB", "BOND", "BONE", "BOOK", "BORDER", "BORROW",
    "BOSS", "BOTH", "BOTHER", "BOTTLE", "BOTTOM", "BOUND", "BOWL", "BOXER", "BRAIN",
    "BRANCH", "BRAND", "BRAVE", "BREAD", "BREAK", "BREATH", "BRICK", "BRIDGE", "BRIEF",
    "BRIGHT", "BRING", "BROAD", "BROKEN", "BROTHER", "BROWN", "BRUSH", "BUCKET", "BUDGET",
    "BUILD", "BULLET", "BUNCH", "BURN", "BURST", "BURY", "BUSY", "BUTTER", "BUTTON",
    "BUYER", "CABIN", "CABLE", "CACHE", "CAGE", "CAKE", "CALL", "CALM", "CAMERA",
    "CAMP", "CANCEL", "CANCER", "CANDLE", "CANVAS", "CAPBLE", "CAPITAL", "CAPTAIN", "CAPTURE",
    "CARBON", "CARD", "CARE", "CAREER", "CAREFUL", "CARRY", "CASE", "CASH", "CAST",
    "CASTLE", "CASUAL", "CATCH", "CATEGORY", "CAUSE", "CAVE", "CELL", "CENTER", "CENTRAL",
    "CENTURY", "CERTAIN", "CHAIN", "CHAIR", "CHALK", "CHANCE", "CHANGE", "CHANNEL", "CHAPTER",
    "CHARGE", "CHARITY", "CHARM", "CHART", "CHASE", "CHAT", "CHEAP", "CHECK", "CHEEK",
    "CHEER", "CHEESE", "CHEF", "CHEMICAL", "CHESS", "CHEST", "CHICKEN", "CHIEF", "CHILD",
    "CHIP", "CHOICE", "CHOOSE", "CHROME", "CHURCH", "CIRCLE", "CIRCUIT", "CITY", "CIVIL",
    "CLAIM", "CLAP", "CLASS", "CLASSIC", "CLEAN", "CLEAR", "CLERK", "CLICK", "CLIENT",
    "CLIMATE", "CLIMB", "CLOCK", "CLOSE", "CLOTH", "CLOUD", "CLUB", "CLUE", "COACH",
    "COAL", "COAST", "COAT", "CODE", "COFFEE", "COIN", "COLD", "COLLECT", "COLLEGE",
    "COLONY", "COLOR", "COLUMN", "COMBINE", "COME", "COMEDY", "COMFORT", "COMMAND", "COMMENT",
    // ... continue adding thousands more ...
];

const fruitData = [
    { text: "APPLE", shape: "🍎" }, { text: "BANANA", shape: "🍌" }, { text: "GRAPE", shape: "🍇" },
    { text: "ORANGE", shape: "🍊" }, { text: "PEAR", shape: "🍐" }, { text: "CHERRY", shape: "🍒" },
    { text: "LEMON", shape: "🍋" }, { text: "WATERMELON", shape: "🍉" },
];

const shootSound = document.getElementById('shootSound');
const destroySound = document.getElementById('destroySound');
const gameOverSound = document.getElementById('gameOverSound');

// --- Utility Functions ---
function random(min, max) { return Math.random() * (max - min) + min; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getRandomWord() { if (wordList.length === 0) { console.error("Word list is empty!"); return "EMPTY"; } return wordList[randomInt(0, wordList.length - 1)]; }
function getRandomFruit() { if (fruitData.length === 0) return null; return fruitData[randomInt(0, fruitData.length - 1)]; }
function playSound(sound) { if (sound) { sound.currentTime = 0; sound.play().catch(e => console.log("Sound play failed:", e)); } }
function triggerScreenShake() { gameContainer.classList.add('shake'); setTimeout(() => gameContainer.classList.remove('shake'), 200); }

// --- Game Objects --- (Cannon, FallingItem, Projectile, DestructionEffect - Keep as in previous correct version)
// Cannon Object
const cannon = { x:0,y:0,baseWidth:CANNON_WIDTH*1.5,baseHeight:CANNON_HEIGHT*0.8,barrelWidth:BARREL_WIDTH,barrelLength:BARREL_LENGTH,angle:-Math.PI/2,color:'hsl(0,100%,50%)',hue:0, updateColor:function(){this.hue=(this.hue+1)%360;this.color=`hsl(${this.hue},100%,60%)`;}, draw:function(ctx){if(!ctx||this.y<=0)return;this.updateColor();const nX=this.x,nY=this.y-this.baseHeight;ctx.fillStyle='#ccc';ctx.beginPath();ctx.moveTo(nX-this.baseWidth/2,this.y);ctx.lineTo(nX+this.baseWidth/2,this.y);ctx.lineTo(nX+this.baseWidth/3,nY);ctx.lineTo(nX-this.baseWidth/3,nY);ctx.closePath();ctx.fill();ctx.strokeStyle='#555';ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.translate(nX,nY);ctx.rotate(this.angle);ctx.fillStyle=this.color;ctx.fillRect(-this.barrelWidth/2,-this.barrelLength,this.barrelWidth,this.barrelLength);ctx.beginPath();ctx.arc(0,-this.barrelLength,this.barrelWidth/1.5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.restore();}, aimAt:function(tX,tY){const nY=this.y-this.baseHeight;const dX=tX-this.x,dY=tY-nY;this.angle=Math.atan2(dY,dX)+Math.PI/2;}, getNozzlePosition:function(){const nBX=this.x,nBY=this.y-this.baseHeight;const nTX=nBX+Math.sin(this.angle)*this.barrelLength,nTY=nBY-Math.cos(this.angle)*this.barrelLength;return{x:nTX,y:nTY};}};
// FallingItem Class
class FallingItem{constructor(t,x,y,s,type='letter',shape=null){this.text=t.toUpperCase();this.x=x;this.y=y;this.speed=s;this.type=type;this.shape=shape;this.currentTypedIndex=0;this.markedForDeletion=false;this.fontSize=(type==='fruit')?FRUIT_FONT:FALLING_ITEM_FONT;this.color=`hsl(${randomInt(0,360)},80%,70%)`;} update(dT){this.y+=this.speed*gameSpeed*dT*0.1;if(!isGameOver&&this.y>=gameOverLineY&&gameOverLineY>0){console.log(`Item ${this.text} hit line Y=${this.y.toFixed(1)} (Line Y=${gameOverLineY.toFixed(1)})`);this.markedForDeletion=true;gameOver();return;} if(this.y>canvas.height+50){this.markedForDeletion=true;if(!isGameOver)gameOver();}} draw(ctx){ctx.font=this.fontSize;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=5;ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;if(this.type==='word'||this.type==='fruit'){const fT=this.text,tP=fT.substring(0,this.currentTypedIndex),rP=fT.substring(this.currentTypedIndex),tW=ctx.measureText(tP).width,totW=ctx.measureText(fT).width,sX=this.x-totW/2;if(this.type==='fruit'&&this.shape)ctx.fillText(this.shape,this.x,this.y-20);ctx.fillStyle='#FFF';ctx.fillText(rP,sX+tW+ctx.measureText(rP).width/2,this.y);ctx.fillStyle='#F44';ctx.fillText(tP,sX+tW/2,this.y);}else{ctx.fillStyle='#FFF';ctx.fillText(this.text,this.x,this.y);} ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;} getNextCharPosition(){ctx.font=this.fontSize;const mets=ctx.measureText(this.text);const totW=mets.width;let appCW=totW/this.text.length||10;const tP=this.text.substring(0,this.currentTypedIndex);const tW=ctx.measureText(tP).width;const sX=this.x-totW/2;const nCCX=sX+tW+(appCW/2);return{x:nCCX,y:this.y};}}
// Projectile Class
class Projectile{constructor(sX,sY,tX,tY,spd=8){this.x=sX;this.y=sY;const dX=tX-sX,dY=tY-sY;const dist=Math.sqrt(dX*dX+dY*dY)||1;this.vX=(dX/dist)*spd;this.vY=(dY/dist)*spd;this.size=4;this.color=`hsl(${randomInt(0,50)},100%,70%)`;this.mfd=false;this.life=100;} update(dT){this.x+=this.vX*dT*0.16;this.y+=this.vY*dT*0.16;this.life--;if(this.life<=0||this.x<-10||this.x>canvas.width+10||this.y<-10||this.y>canvas.height+10)this.mfd=true;} draw(ctx){ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();ctx.fillStyle=`hsla(${randomInt(0,50)},100%,70%,0.5)`;ctx.beginPath();ctx.arc(this.x-this.vX*0.5,this.y-this.vY*0.5,this.size*0.7,0,Math.PI*2);ctx.fill();}}
// DestructionEffect Class
class DestructionEffect{constructor(x,y,count=10){this.particles=[];for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=random(1,5);this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,size:random(2,5),life:random(20,40),color:`hsl(${randomInt(0,360)},100%,70%)`});} this.mfd=false;} update(dT){let allDead=true;this.particles.forEach(p=>{if(p.life>0){allDead=false;p.x+=p.vx*dT*0.1;p.y+=p.vy*dT*0.1;p.life--;p.size*=0.98;if(p.size<0.5)p.life=0;}});if(allDead)this.mfd=true;} draw(ctx){this.particles.forEach(p=>{if(p.life>0){ctx.fillStyle=p.color;ctx.globalAlpha=p.life/40;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1.0;}});}}


// --- Mobile Input Handling ---
function simulateKeyPress(key) { if (isGameOver) return; const uKey = key.toUpperCase(); if (uKey.length !== 1 || !/[A-Z]/.test(uKey)) return; console.log(`[Simulate] Key: ${uKey}`); const event = new KeyboardEvent('keydown', { key: uKey, code: `Key${uKey}`, bubbles: true, cancelable: true }); document.dispatchEvent(event); }

if (keyboardContainer) {
    console.log("Attaching touch listener to keyboard container."); // Confirm listener attachment
    keyboardContainer.addEventListener('touchstart', function(e) {
        console.log("Touchstart event detected on keyboard container."); // Log event start
        const targetButton = e.target.closest('button[data-key]'); // Handle touch slightly inside/outside button

        if (targetButton) {
            console.log("Touch target is keyboard button:", targetButton.dataset.key); // Log target
            e.preventDefault(); // Prevent default touch behavior *only* if it's our button
            const key = targetButton.dataset.key;
            simulateKeyPress(key); // Simulate the key press

            // Visual feedback
            targetButton.classList.add('tapped');
            setTimeout(() => {
                 if(targetButton.classList.contains('tapped')) {
                    targetButton.classList.remove('tapped');
                 }
            }, 150);
        } else {
             console.log("Touch target is NOT a keyboard button."); // Log if touch missed button
        }
    }, { passive: false }); // Must be false to allow preventDefault

} else { console.warn("Onscreen keyboard container not found!"); }

// --- Audio Initialization ---
function initAudio() { const s=[shootSound,destroySound,gameOverSound];let ul=false;const un=()=>{if(ul)return;s.forEach(d=>{if(d)d.play().then(()=>d.pause()).catch(()=>{});});ul=true;document.removeEventListener('touchstart',un);document.removeEventListener('click',un);console.log("Audio Context Unlocked (attempted)");};document.addEventListener('touchstart',un,{once:true});document.addEventListener('click',un,{once:true});}

// --- Game Logic Functions ---
function spawnItem() {
    if (!gameMode || isGameOver) return;
    const now = Date.now();
    if (now - lastSpawnTime < spawnInterval) return;
    lastSpawnTime = now;
    const x = random(50, canvas.width - 50), y = -20; let newItem=null, itemType='none';
    if(level===1){const r=Math.random();if(r<0.3){const l=String.fromCharCode(randomInt(65,90));newItem=new FallingItem(l,x,y,random(0.8,1.5),'letter');itemType='letter';}else{const w=getRandomWord();if(w&&w.length>0){newItem=new FallingItem(w,x,y,random(0.6,1.2),'word');itemType=`word(${w})`;}else{console.warn("Word fail->letter");const l=String.fromCharCode(randomInt(65,90));newItem=new FallingItem(l,x,y,random(0.8,1.5),'letter');itemType='letter(fb)';}}}
    else{const f=getRandomFruit();if(f){newItem=new FallingItem(f.text,x,y,random(0.7,1.4),'fruit',f.shape);itemType=`fruit(${f.text})`;}else{console.warn("Fruit fail->letter");const l=String.fromCharCode(randomInt(65,90));newItem=new FallingItem(l,x,y,random(0.8,1.5),'letter');itemType='letter(fb)';}}
    if(newItem){console.log(`Spawn: ${itemType}, Interval:${spawnInterval.toFixed(0)}ms`);fallingItems.push(newItem);}else{console.error("Failed to create newItem");}
    spawnInterval=Math.max(500,spawnInterval*0.995);
}

function handleInput(event) {
    console.log(`[Input] Key: ${event.key}, Code: ${event.code}`); // Log all input events
    if (isGameOver || !gameMode) return;
    const key = event.key.toUpperCase();
    if (key.length !== 1 || !/[A-Z]/.test(key)) return;
    let hit = false; let targetItem = null;
    let pT = fallingItems.filter(i=>i.currentTypedIndex>0 && !i.markedForDeletion);
    if(pT.length>0){ pT.sort((a,b)=>b.y-a.y); targetItem=pT[0]; if(targetItem.text[targetItem.currentTypedIndex]===key) hit=true; }
    if(!hit){ pT=fallingItems.filter(i=>!i.markedForDeletion && i.text.length>0 && i.text[0]===key && i.currentTypedIndex===0); if(pT.length>0){ pT.sort((a,b)=>b.y-a.y); targetItem=pT[0]; hit=true; } }
    if(hit && targetItem){ console.log(`[Hit] Targeting: ${targetItem.text}, Key: ${key}`); const tPos=targetItem.getNextCharPosition(); cannon.aimAt(tPos.x,tPos.y); const nPos=cannon.getNozzlePosition(); projectiles.push(new Projectile(nPos.x,nPos.y,tPos.x,tPos.y)); playSound(shootSound); targetItem.currentTypedIndex++; if(targetItem.currentTypedIndex>=targetItem.text.length){ console.log(`[Complete] Word: ${targetItem.text}`); score+=targetItem.text.length*10; targetItem.markedForDeletion=true; effects.push(new DestructionEffect(tPos.x,tPos.y)); playSound(destroySound); triggerScreenShake(); updateScoreAndLevel(); } }
    else { console.log(`[Miss/New] Key: ${key}`); } // Log if no target found or wrong key
}

function updateScoreAndLevel() {scoreDisplay.textContent=`Score:${score}`;levelDisplay.textContent=`Level:${level}`;const spdM=Math.floor(score/SCORE_MILESTONE);gameSpeed=BASE_SPEED+spdM*SPEED_INCREMENT;if(score>=WIN_SCORE&&level===1){level=2;levelDisplay.textContent=`Level:${level}`;console.log("LEVEL 2!");spawnInterval*=0.8;}}
function gameOver() {if(isGameOver)return;isGameOver=true;playSound(gameOverSound);finalScoreDisplay.textContent=score;gameOverScreen.style.display='flex';console.log("Game Over!");if(animationFrameId){cancelAnimationFrame(animationFrameId);animationFrameId=null;}}
function restartGame() { score=0;level=1;gameSpeed=BASE_SPEED;isGameOver=false;fallingItems=[];projectiles=[];effects=[];cannon.angle=-Math.PI/2;spawnInterval=2000;gameOverScreen.style.display='none';if(gameMode==='mobile'&&keyboardContainer)keyboardContainer.style.display='flex';updateScoreAndLevel();lastSpawnTime=Date.now();lastTime=performance.now();if(!animationFrameId)gameLoop(lastTime);}

// --- Canvas Resizing ---
function resizeCanvas() {
    if(!canvas||!cannon||!ctx)return; canvas.width=window.innerWidth;canvas.height=window.innerHeight; cannon.x=canvas.width/2;let cY;if(gameMode==='mobile'){const kH=Math.min(MOBILE_KEYBOARD_HEIGHT_ESTIMATE,canvas.height*0.3);cY=canvas.height-kH-15;}else{cY=canvas.height-15;} cannon.y=Math.max(cannon.baseHeight+5,cY); gameOverLineY=cannon.y-cannon.baseHeight-5; console.log(`Resize:${canvas.width}x${canvas.height}, Mode:${gameMode}, CannonY:${cannon.y.toFixed(1)}, LineY:${gameOverLineY.toFixed(1)}`); if(gameMode&&!isGameOver){ctx.clearRect(0,0,canvas.width,canvas.height);cannon.draw(ctx);}
}

// --- Game Loop ---
let lastTime = 0;
function gameLoop(timestamp) {
    if (isGameOver || !gameMode) { animationFrameId = null; return; }
    animationFrameId = requestAnimationFrame(gameLoop);
    const dT = timestamp - lastTime; lastTime = timestamp; const dt = Math.min(dT || 16.67, 50);
    if (!ctx) { console.error("Ctx lost!"); cancelAnimationFrame(animationFrameId); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    spawnItem();
    fallingItems.forEach(i=>i.update(dt)); projectiles.forEach(p=>p.update(dt)); effects.forEach(e=>e.update(dt));
    fallingItems=fallingItems.filter(i=>!i.markedForDeletion); projectiles=projectiles.filter(p=>!p.markedForDeletion); effects=effects.filter(e=>!e.markedForDeletion);
    cannon.draw(ctx); projectiles.forEach(p=>p.draw(ctx)); fallingItems.forEach(i=>i.draw(ctx)); effects.forEach(e=>e.draw(ctx));
}

// --- Mode Selection and Game Start ---
function selectMode(mode) { if(mode!=='desktop'&&mode!=='mobile')return; gameMode=mode; console.log("Selected Mode:",gameMode); if(modeSelectionScreen)modeSelectionScreen.style.display='none';if(gameContainer)gameContainer.style.display='block';if(gameMode==='mobile'){document.body.classList.add('mobile-mode-active');if(keyboardContainer)keyboardContainer.style.display='flex';}else{document.body.classList.remove('mobile-mode-active');if(keyboardContainer)keyboardContainer.style.display='none';} startGame(); }
function startGame() { console.log("Init game..."); isGameOver=false;score=0;level=1;fallingItems=[];projectiles=[];effects=[]; initAudio(); resizeCanvas(); updateScoreAndLevel(); lastSpawnTime=Date.now()-spawnInterval+500; spawnInterval=2000; if(animationFrameId){cancelAnimationFrame(animationFrameId);animationFrameId=null;} lastTime=performance.now(); gameLoop(lastTime); console.log("Loop initiated."); }

// --- Global Event Listeners Setup ---
window.addEventListener('resize', resizeCanvas);
document.addEventListener('keydown', handleInput); // Listen for physical keyboard
restartButton.addEventListener('click', restartGame);
if(desktopModeButton&&mobileModeButton&&modeSelectionScreen){desktopModeButton.addEventListener('click',()=>selectMode('desktop'));mobileModeButton.addEventListener('click',()=>selectMode('mobile'));}else{console.error("Mode buttons/screen missing!");}

// --- Initial Page Load ---
console.log("Page loaded. Waiting for mode selection.");
if(gameContainer)gameContainer.style.display='none';
if(modeSelectionScreen)modeSelectionScreen.style.display='flex';
