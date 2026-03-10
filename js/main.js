import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js';

const GameData = {
    hulls: { 
        "hunter": { name: "Охотник", hp: 150, armor: { front: 60, side: 30, rear: 20 }, speed: 50, size: {w: 60, h: 45}, hitbox: {w: 50, h: 35} } 
    },
    turrets: { 
        "scourge": { name: "Плеть", fireRate: 1.0, penetration: 80, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ffaa00', shootSound: 'cannon' } 
    },
    enemyHulls: { 
        "basic": { name: "Враг-Базовый", hp: 100, armor: { front: 60, side: 30, rear: 15 }, speed: 45, size: {w: 60, h: 45}, hitbox: {w: 50, h: 35} },
        "scout": { name: "Скаут", hp: 90, armor: { front: 40, side: 40, rear: 40 }, speed: 60, size: {w: 60, h: 45}, hitbox: {w: 45, h: 29} } 
    },
    enemyTurrets: { 
        "basic": { name: "Враг-Пушка", fireRate: 1.5, penetration: 60, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ff5500', shootSound: 'cannon' },
        "scout": { name: "Скаут-Автопушка", fireRate: 2.0, penetration: 35, burstCount: 3, burstDelay: 0.15, bulletRadius: 1.5, bulletColor: '#ffffdd', shootSound: 'mg' } 
    }
};

let currentAssembly = { hullId: "hunter", turretId: "scourge" };

let PlayerProgress = { 
    unlockedLevel: 1, 
    passedLevels: [], 
    points: 0,        
    currentHp: 150    
}; 

const LevelsConfig = { 
    1: { pool: ["basic", "basic", "basic", "basic"], obstacles: 1 }, 
    2: { pool: ["basic", "basic", "basic", "scout", "scout"], obstacles: 2 }, 
    3: { pool: ["basic", "basic", "basic", "scout", "scout", "scout"], obstacles: 3 }
};
let currentEnemyPool = [];

const screens = { hangar: document.getElementById('hangar-screen'), levels: document.getElementById('levels-screen'), game: document.getElementById('gameCanvas') };
function showScreen(screenName) { screens.hangar.style.display = screenName === 'hangar' ? 'flex' : 'none'; screens.levels.style.display = screenName === 'levels' ? 'flex' : 'none'; screens.game.style.display = screenName === 'game' ? 'block' : 'none'; }

function updateHangarUI() { 
    let hData = GameData.hulls[currentAssembly.hullId]; 
    let tData = GameData.turrets[currentAssembly.turretId]; 

    document.getElementById('player-points').innerText = PlayerProgress.points;
    document.getElementById('hangar-hull-name').innerText = hData.name;
    document.getElementById('hangar-turret-name').innerText = tData.name;

    document.getElementById('stat-hp').innerText = `${PlayerProgress.currentHp} / ${hData.hp}`; 
    document.getElementById('stat-armor').innerText = `${hData.armor.front} / ${hData.armor.side} / ${hData.armor.rear}`; 
    document.getElementById('stat-speed').innerText = hData.speed; 
    document.getElementById('stat-penetration').innerText = tData.penetration; 
}

document.getElementById('heal-btn').addEventListener('click', () => {
    let maxHp = GameData.hulls[currentAssembly.hullId].hp;
    if (PlayerProgress.points >= 1 && PlayerProgress.currentHp < maxHp) {
        PlayerProgress.points -= 1;
        PlayerProgress.currentHp = Math.floor(PlayerProgress.currentHp + (maxHp * 0.2));
        if (PlayerProgress.currentHp > maxHp) PlayerProgress.currentHp = maxHp;
        updateHangarUI();
    }
});

updateHangarUI();
document.getElementById('to-levels-btn').addEventListener('click', () => { generateLevelsGrid(); showScreen('levels'); });
document.getElementById('back-to-hangar-btn').addEventListener('click', () => { showScreen('hangar'); updateHangarUI(); });

function generateLevelsGrid() { 
    const grid = document.getElementById('levels-grid'); grid.innerHTML = ''; 
    for (let i = 1; i <= 100; i++) { 
        let btn = document.createElement('button'); 
        if (PlayerProgress.passedLevels.includes(i)) btn.className = 'level-btn passed'; 
        else if (i <= PlayerProgress.unlockedLevel) btn.className = 'level-btn unlocked'; 
        else btn.className = 'level-btn locked'; 
        btn.innerHTML = `<div>${i}</div>`; 
        if (i <= PlayerProgress.unlockedLevel) btn.onclick = () => startLevel(i); 
        grid.appendChild(btn); 
    } 
}

const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 600;
const input = new Input(canvas); const arena = new Arena(canvas.width, canvas.height);

const hullImage = new Image(); const turretImage = new Image();
const enemyHullImage = new Image(); const enemyTurretImage = new Image();
const scoutHullImage = new Image(); const scoutTurretImage = new Image();
const shootSound = new Audio('assets/sounds/shoot.mp3'); const hitSound = new Audio('assets/sounds/hit.mp3');
const bounceSound = new Audio('assets/sounds/bounce.mp3'); const explodeSound = new Audio('assets/sounds/explode.mp3'); 
const mgShootSound = new Audio('assets/sounds/mg-shoot.mp3'); mgShootSound.volume = 0.2; shootSound.volume = 0.3; hitSound.volume = 0.6; bounceSound.volume = 0.5; explodeSound.volume = 0.8;
function playSound(audio) { let clone = audio.cloneNode(); clone.volume = audio.volume; clone.play().catch(e => {}); }

let playerTank, enemies = [], bullets = [], sparks = [], floatingTexts = [];
let lastTime = 0, gameRunning = false, currentLevelNum = 1, enemiesToSpawn = 0, enemySpawnTimer = 0, levelFinished = false, animFrameId = null;

// ОБНОВЛЕНО: Флаг для бонуса за первое прохождение
let firstClearBonus = false; 

function spawnText(x, y, text, color) { floatingTexts.push({ x, y, text, color, life: 1.5, maxLife: 1.5, vy: -30 }); }
function spawnSparks(x, y, nx, ny) { let count = 5 + Math.floor(Math.random() * 6); let base = Math.atan2(ny, nx); for (let i = 0; i < count; i++) { let spread = (Math.random() - 0.5) * Math.PI; let speed = 100 + Math.random() * 200; sparks.push({ x, y, vx: Math.cos(base+spread)*speed, vy: Math.sin(base+spread)*speed, life: 0.2+Math.random()*0.2, maxLife: 0.4, size: 2+Math.random()*3, color: '255, 200, 0' }); } }
function spawnExplosion(x, y) { playSound(explodeSound); let colors = ['255, 50, 0', '255, 150, 0', '100, 100, 100', '40, 40, 40']; for (let i = 0; i < 100; i++) { let a = Math.random() * Math.PI * 2; let s = 50 + Math.random() * 350; sparks.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1.5+Math.random()*2.0, maxLife: 3.5, size: 10+Math.random()*25, color: colors[Math.floor(Math.random()*colors.length)] }); } }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }

function startLevel(levelNum) {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    gameRunning = false; currentLevelNum = levelNum;
    let config = LevelsConfig[levelNum] || { pool: ["basic"], obstacles: 1 };
    
    currentEnemyPool = shuffleArray([...config.pool]);
    enemiesToSpawn = currentEnemyPool.length; enemySpawnTimer = 0; levelFinished = false;
    firstClearBonus = false; // Сбрасываем флаг

    arena.generateObstacles(config.obstacles);

    playerTank = new Tank(400, 300, hullImage, turretImage, GameData.hulls["hunter"], GameData.turrets["scourge"], PlayerProgress.currentHp);
    enemies = []; bullets = []; sparks = []; floatingTexts = [];
    showScreen('game'); lastTime = performance.now(); gameRunning = true; animFrameId = requestAnimationFrame(gameLoop);
}

function spawnEnemyOnArena() {
    if (currentEnemyPool.length === 0) return;
    let safeDist = 200; let spawnX, spawnY, validSpawn = false, attempts = 0; let enemyRadius = 30;
    do {
        validSpawn = true;
        spawnX = 50 + Math.random() * (canvas.width - 100); spawnY = 50 + Math.random() * (canvas.height - 100);
        let distToPlayer = Math.sqrt(Math.pow(spawnX - playerTank.x, 2) + Math.pow(spawnY - playerTank.y, 2));
        if (distToPlayer <= safeDist) validSpawn = false;
        if (validSpawn && arena.checkCollision(spawnX, spawnY, enemyRadius)) validSpawn = false;
        if (validSpawn) {
            for (let e of enemies) {
                let distToEnemy = Math.sqrt(Math.pow(spawnX - e.x, 2) + Math.pow(spawnY - e.y, 2));
                if (distToEnemy < 75) { validSpawn = false; break; }
            }
        }
        attempts++;
    } while (!validSpawn && attempts < 100); 

    let enemyType = currentEnemyPool.pop(); let hStats = GameData.enemyHulls[enemyType]; let tStats = GameData.enemyTurrets[enemyType];
    let useHullImg = enemyType === "scout" ? scoutHullImage : enemyHullImage; let useTurretImg = enemyType === "scout" ? scoutTurretImage : enemyTurretImage;
    enemies.push(new Enemy(spawnX, spawnY, useHullImg, useTurretImg, hStats, tStats));
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    let dt = (timestamp - lastTime) / 1000; if (isNaN(dt)) dt = 0; if (dt > 0.1) dt = 0.1; lastTime = timestamp;

    if (enemiesToSpawn > 0 && playerTank.hp > 0 && !levelFinished) {
        if (enemies.length === 0) enemySpawnTimer = 0; else enemySpawnTimer -= dt;
        if (enemySpawnTimer <= 0) { spawnEnemyOnArena(); enemiesToSpawn--; enemySpawnTimer = 5 + (enemies.length * 5); }
    }
    
    if (enemiesToSpawn === 0 && enemies.length === 0 && playerTank.hp > 0 && !levelFinished) {
        levelFinished = true; 
        PlayerProgress.currentHp = playerTank.hp; 

        if (!PlayerProgress.passedLevels.includes(currentLevelNum)) {
            PlayerProgress.points += 5; 
            PlayerProgress.passedLevels.push(currentLevelNum);
            if (PlayerProgress.unlockedLevel === currentLevelNum) {
                PlayerProgress.unlockedLevel++; 
            }
            firstClearBonus = true; // Зажигаем флаг для отрисовки надписи
        }

        setTimeout(() => { gameRunning = false; generateLevelsGrid(); showScreen('levels'); }, 3000);
    }

    if (playerTank.hp <= 0 && !levelFinished) { 
        levelFinished = true; 
        let maxHp = GameData.hulls[currentAssembly.hullId].hp;
        PlayerProgress.currentHp = Math.floor(maxHp * 0.2);
        setTimeout(() => { gameRunning = false; updateHangarUI(); showScreen('hangar'); }, 3000); 
    }

    if (playerTank.hp > 0) {
        playerTank.update(dt, input, arena, enemies);
        if (input.isShooting()) playerTank.tryShoot(); 
        let pShots = playerTank.getShots();
        for (let i = 0; i < pShots; i++) { bullets.push(new Bullet(playerTank.x + Math.cos(playerTank.turretAngle)*35, playerTank.y + Math.sin(playerTank.turretAngle)*35, playerTank.turretAngle, playerTank, playerTank.penetration, playerTank.bulletRadius, playerTank.bulletColor)); playSound(playerTank.shootSoundType === 'mg' ? mgShootSound : shootSound); }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        if (enemy.hp > 0) {
            enemy.updateAI(dt, arena, playerTank, enemies);
            let eShots = enemy.getShots();
            for (let j = 0; j < eShots; j++) { let barrelOffset = enemy.hullWidth > 50 ? 35 : 25; bullets.push(new Bullet(enemy.x + Math.cos(enemy.turretAngle)*barrelOffset, enemy.y + Math.sin(enemy.turretAngle)*barrelOffset, enemy.turretAngle, enemy, enemy.penetration, enemy.bulletRadius, enemy.bulletColor)); playSound(enemy.shootSoundType === 'mg' ? mgShootSound : shootSound); }
        } else {
            PlayerProgress.points += 1;
            // ОБНОВЛЕНО: Всплывающий текст с шестеренкой желтого цвета
            spawnText(enemy.x, enemy.y, "+1 ⚙️", '#ffcc00');
            enemies.splice(i, 1); 
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; b.update(dt, arena, spawnSparks, () => playSound(bounceSound));
        if (b.toDestroy) continue; let hasHit = false;
        if (b.ownerTank !== playerTank && playerTank && playerTank.hp > 0 && b.lastHitTarget !== playerTank) {
            let hit = playerTank.checkHit(b);
            if (hit.hit) {
                hasHit = true;
                if (hit.type === 'penetration') { b.toDestroy = true; spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333'); playSound(hitSound); if (hit.destroyed) spawnExplosion(playerTank.x, playerTank.y); } 
                else { b.x = b.prevX; b.y = b.prevY; b.bounce(hit.nx, hit.ny); b.isDecaying = true; b.lastHitTarget = playerTank; spawnSparks(hit.x, hit.y, hit.nx, hit.ny); playSound(bounceSound); }
            }
        }
        if (!hasHit) {
            for (let enemy of enemies) {
                if (b.ownerTank === enemy || b.lastHitTarget === enemy) continue; 
                let hit = enemy.checkHit(b);
                if (hit.hit) {
                    if (hit.type === 'penetration') { b.toDestroy = true; spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333'); playSound(hitSound); if (hit.destroyed) spawnExplosion(enemy.x, enemy.y); } 
                    else { b.x = b.prevX; b.y = b.prevY; b.bounce(hit.nx, hit.ny); b.isDecaying = true; b.lastHitTarget = enemy; spawnSparks(hit.x, hit.y, hit.nx, hit.ny); playSound(bounceSound); }
                    break; 
                }
            }
        }
    }
    bullets = bullets.filter(b => !b.toDestroy);
    
    for (let i = sparks.length - 1; i >= 0; i--) { let s = sparks[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy *= 0.93; if (s.life <= 0) sparks.splice(i, 1); }
    for (let i = floatingTexts.length - 1; i >= 0; i--) { let ft = floatingTexts[i]; ft.life -= dt; ft.y += ft.vy * dt; if (ft.life <= 0) floatingTexts.splice(i, 1); }

    ctx.clearRect(0, 0, canvas.width, canvas.height); arena.draw(ctx);
    for (let b of bullets) b.draw(ctx);
    for (let s of sparks) { ctx.fillStyle = `rgba(${s.color}, ${Math.max(0, s.life / s.maxLife)})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); }
    if (playerTank && playerTank.hp > 0) playerTank.draw(ctx);
    for (let e of enemies) e.draw(ctx);

    if (playerTank && playerTank.hp > 0) { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'left'; ctx.fillText(`ХП: ${playerTank.hp} | Броня: Лоб ${playerTank.armor.front.current} | Борт ${playerTank.armor.side.current} | Корма ${playerTank.armor.rear.current}`, 15, 30); }
    ctx.font = '900 20px Arial, sans-serif'; ctx.textAlign = 'center';
    for (let ft of floatingTexts) { let alpha = Math.max(0, ft.life / ft.maxLife); ctx.globalAlpha = alpha; ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.strokeText(ft.text, ft.x, ft.y); ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y); }
    ctx.globalAlpha = 1.0;

    // ОБНОВЛЕНО: Отрисовка финальных текстов
    if (playerTank.hp <= 0) { 
        ctx.font = '900 50px Arial'; ctx.fillStyle = '#ff0000'; ctx.textAlign = 'center'; 
        ctx.strokeText('ТАНК УНИЧТОЖЕН', canvas.width / 2, canvas.height / 2); ctx.fillText('ТАНК УНИЧТОЖЕН', canvas.width / 2, canvas.height / 2); 
    } else if (levelFinished) { 
        ctx.font = '900 50px Arial'; ctx.fillStyle = '#00ff00'; ctx.textAlign = 'center'; 
        ctx.strokeText('СЕКТОР ЗАЧИЩЕН!', canvas.width / 2, canvas.height / 2 - 20); ctx.fillText('СЕКТОР ЗАЧИЩЕН!', canvas.width / 2, canvas.height / 2 - 20); 
        
        // Рисуем бонус за первое прохождение
        if (firstClearBonus) {
            ctx.font = '900 30px Arial'; ctx.fillStyle = '#ffcc00'; 
            ctx.strokeText('Первое прохождение: +5 ⚙️', canvas.width / 2, canvas.height / 2 + 30);
            ctx.fillText('Первое прохождение: +5 ⚙️', canvas.width / 2, canvas.height / 2 + 30);
        }
    }
    
    animFrameId = requestAnimationFrame(gameLoop);
}

const noCache = '?v=' + new Date().getTime(); hullImage.src = 'assets/hull.png' + noCache; turretImage.src = 'assets/turret.png' + noCache; enemyHullImage.src = 'assets/enemy-hull.png' + noCache; enemyTurretImage.src = 'assets/enemy-turret.png' + noCache; scoutHullImage.src = 'assets/scout-hull.png' + noCache; scoutTurretImage.src = 'assets/scout-turret.png' + noCache;
