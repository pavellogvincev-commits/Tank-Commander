import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js';
import { GameData, PlayerProgress, LevelsConfig } from './GameData.js';
import { initHangarUI, showScreen, updateHangarUI, screens, generateLevelsGrid } from './Hangar.js';

const noCache = '?v=' + new Date().getTime(); 
const playerImages = { hulls: { "hunter": new Image(), "leopard": new Image(), "titan": new Image() }, turrets: { "scourge": new Image() } };
playerImages.hulls["hunter"].src = 'assets/hull.png' + noCache; playerImages.hulls["leopard"].src = 'assets/leopard.png' + noCache; playerImages.hulls["titan"].src = 'assets/titan.png' + noCache; playerImages.turrets["scourge"].src = 'assets/turret.png' + noCache;
const enemyHullImage = new Image(); enemyHullImage.src = 'assets/enemy-hull.png' + noCache; const enemyTurretImage = new Image(); enemyTurretImage.src = 'assets/enemy-turret.png' + noCache;
const scoutHullImage = new Image(); scoutHullImage.src = 'assets/scout-hull.png' + noCache; const scoutTurretImage = new Image(); scoutTurretImage.src = 'assets/scout-turret.png' + noCache;
const demonHullImage = new Image(); demonHullImage.src = 'assets/demon-hull.png' + noCache; const demonTurretImage = new Image(); demonTurretImage.src = 'assets/demon-turret.png' + noCache;

const shootSound = new Audio('assets/sounds/shoot.mp3'); const hitSound = new Audio('assets/sounds/hit.mp3'); const bounceSound = new Audio('assets/sounds/bounce.mp3'); const explodeSound = new Audio('assets/sounds/explode.mp3'); const mgShootSound = new Audio('assets/sounds/mg-shoot.mp3'); 
mgShootSound.volume = 0.2; shootSound.volume = 0.3; hitSound.volume = 0.6; bounceSound.volume = 0.5; explodeSound.volume = 0.8;
function playSound(audio) { let clone = audio.cloneNode(); clone.volume = audio.volume; clone.play().catch(e => {}); }

const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 700;
const input = new Input(canvas); const arena = new Arena(canvas.width, canvas.height);

let playerTank, enemies = [], bullets = [], sparks = [], floatingTexts = [], drops = [];
let lastTime = 0, gameRunning = false, currentLevelNum = 1, enemiesToSpawn = 0, enemySpawnTimer = 0, levelFinished = false, animFrameId = null;
let firstClearBonus = false, currentEnemyPool = [];

let dropCheckTimer = 5.0;
let currentDropChance = 0.10;
let dropsSpawnedThisMatch = 0;
let maxDropsForLevel = 0;

function spawnText(x, y, text, color) { floatingTexts.push({ x, y, text, color, life: 1.5, maxLife: 1.5, vy: -30 }); }
function spawnSparks(x, y, nx, ny) { let count = 5 + Math.floor(Math.random() * 6); let base = Math.atan2(ny, nx); for (let i = 0; i < count; i++) { let spread = (Math.random() - 0.5) * Math.PI; let speed = 100 + Math.random() * 200; sparks.push({ x, y, vx: Math.cos(base+spread)*speed, vy: Math.sin(base+spread)*speed, life: 0.2+Math.random()*0.2, maxLife: 0.4, size: 2+Math.random()*3, color: '255, 200, 0' }); } }
function spawnExplosion(x, y) { playSound(explodeSound); let colors = ['255, 50, 0', '255, 150, 0', '100, 100, 100', '40, 40, 40']; for (let i = 0; i < 100; i++) { let a = Math.random() * Math.PI * 2; let s = 50 + Math.random() * 350; sparks.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1.5+Math.random()*2.0, maxLife: 3.5, size: 10+Math.random()*25, color: colors[Math.floor(Math.random()*colors.length)] }); } }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }

function startLevel(levelNum) {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    gameRunning = false; currentLevelNum = levelNum;
    
    let config = LevelsConfig[levelNum] || { pool: ["basic"], obstacles: 1, maxUpgrades: 0 };
    currentEnemyPool = shuffleArray([...config.pool]);
    enemiesToSpawn = currentEnemyPool.length; enemySpawnTimer = 0; levelFinished = false; firstClearBonus = false; 

    dropCheckTimer = 5.0; currentDropChance = 0.10; dropsSpawnedThisMatch = 0;
    maxDropsForLevel = config.maxUpgrades - (PlayerProgress.collectedStars[levelNum] || 0);

    arena.generateObstacles(config.obstacles);

    const hullId = PlayerProgress.currentAssembly.hullId;
    const turretId = PlayerProgress.currentAssembly.turretId;
    
    let bHull = GameData.hulls[hullId]; let sHull = PlayerProgress.partStats[hullId];
    let calcHull = JSON.parse(JSON.stringify(bHull)); 
    calcHull.hp += sHull.hp * bHull.upgrades.hp;
    calcHull.speed += sHull.speed * bHull.upgrades.speed;
    calcHull.armor.front += sHull.armor * bHull.upgrades.armor.front;
    calcHull.armor.side += sHull.armor * bHull.upgrades.armor.side;
    calcHull.armor.rear += sHull.armor * bHull.upgrades.armor.rear;

    let bTurr = GameData.turrets[turretId]; let sTurr = PlayerProgress.partStats[turretId];
    let calcTurr = JSON.parse(JSON.stringify(bTurr));
    calcTurr.penetration += sTurr.penetration * bTurr.upgrades.penetration;
    calcTurr.fireRate += sTurr.fireRate * bTurr.upgrades.fireRate;

    playerTank = new Tank(500, 350, playerImages.hulls[hullId], playerImages.turrets[turretId], calcHull, calcTurr, PlayerProgress.hullsHp[hullId]);
    
    enemies = []; bullets = []; sparks = []; floatingTexts = []; drops = [];
    showScreen('game'); lastTime =
    let useHullImg = enemyType === "scout" ? scoutHullImage : (enemyType === "demon" ? demonHullImage : enemyHullImage);
    let useTurretImg = enemyType === "scout" ? scoutTurretImage : (enemyType === "demon" ? demonTurretImage : enemyTurretImage);
    enemies.push(new Enemy(spawnX, spawnY, useHullImg, useTurretImg, hStats, tStats));
}

function spawnDrop() {
    let spawnX, spawnY, valid = false, attempts = 0;
    do {
        valid = true; spawnX = 50 + Math.random()*(canvas.width-100); spawnY = 50 + Math.random()*(canvas.height-100);
        if (arena.checkCollision(spawnX, spawnY, 20)) valid = false;
        attempts++;
    } while (!valid && attempts < 100);
    
    if (valid) {
        let type = Math.random() > 0.5 ? 'hull' : 'turret';
        drops.push({ x: spawnX, y: spawnY, type: type, radius: 15 });
    }
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    let dt = (timestamp - lastTime) / 1000; if (isNaN(dt)) dt = 0; if (dt > 0.1) dt = 0.1; lastTime = timestamp;

    if (dropsSpawnedThisMatch < maxDropsForLevel && playerTank.hp > 0 && !levelFinished) {
        dropCheckTimer -= dt;
        if (dropCheckTimer <= 0) {
            dropCheckTimer = 5.0;
            if (Math.random() <= currentDropChance) {
                spawnDrop(); dropsSpawnedThisMatch++; currentDropChance = 0.10; 
            } else { currentDropChance += 0.10; }
        }
    }

    if (enemiesToSpawn > 0 && playerTank.hp > 0 && !levelFinished) {
        if (enemies.length === 0) enemySpawnTimer = 0; else enemySpawnTimer -= dt;
        if (enemySpawnTimer <= 0) { spawnEnemyOnArena(); enemiesToSpawn--; enemySpawnTimer = enemies.length * 2.5; }
    }
    
    if (enemiesToSpawn === 0 && enemies.length === 0 && playerTank.hp > 0 && !levelFinished) {
        levelFinished = true; 
        const hullId = PlayerProgress.currentAssembly.hullId; PlayerProgress.hullsHp[hullId] = playerTank.hp; 
        if (!PlayerProgress.passedLevels.includes(currentLevelNum)) { PlayerProgress.points += 5; PlayerProgress.passedLevels.push(currentLevelNum); if (PlayerProgress.unlockedLevel === currentLevelNum) PlayerProgress.unlockedLevel++; firstClearBonus = true; }
        setTimeout(() => { gameRunning = false; updateHangarUI(); generateLevelsGrid(); showScreen('levels'); }, 3000);
    }

    if (playerTank.hp <= 0 && !levelFinished) { 
        levelFinished = true; 
        const hullId = PlayerProgress.currentAssembly.hullId;
        const calcMaxHp = GameData.hulls[hullId].hp + (PlayerProgress.partStats[hullId].hp * GameData.hulls[hullId].upgrades.hp);
        PlayerProgress.hullsHp[hullId] = Math.floor(calcMaxHp * 0.2); 
        setTimeout(() => { gameRunning = false; updateHangarUI(); showScreen('hangar'); }, 3000); 
    }

    if (playerTank.hp > 0) {
        playerTank.update(dt, input, arena, enemies);
        if (input.isShooting()) playerTank.tryShoot(); 
        let pShots = playerTank.getShots();
        for (let i = 0; i < pShots; i++) { bullets.push(new Bullet(playerTank.x + Math.cos(playerTank.turretAngle)*45, playerTank.y + Math.sin(playerTank.turretAngle)*45, playerTank.turretAngle, playerTank, playerTank.penetration, playerTank.bulletRadius, playerTank.bulletColor, playerTank.bulletSpeed)); playSound(playerTank.shootSoundType === 'mg' ? mgShootSound : shootSound); }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        if (enemy.hp > 0) {
            enemy.updateAI(dt, arena, playerTank, enemies); let eShots = enemy.getShots();
            for (let j = 0; j < eShots; j++) { bullets.push(new Bullet(enemy.x + Math.cos(enemy.turretAngle)*45, enemy.y + Math.sin(enemy.turretAngle)*45, enemy.turretAngle, enemy, enemy.penetration, enemy.bulletRadius, enemy.bulletColor, enemy.bulletSpeed)); playSound(enemy.shootSoundType === 'mg' ? mgShootSound : shootSound); }
        } else { PlayerProgress.points += 1; spawnText(enemy.x, enemy.y, "+1 ⚙️", '#ffcc00'); enemies.splice(i, 1); }
    }

    if (playerTank && playerTank.hp > 0) {
        for (let i = drops.length - 1; i >= 0; i--) {
            let d = drops[i]; let dist = Math.sqrt(Math.pow(d.x - playerTank.x, 2) + Math.pow(d.y - playerTank.y, 2));
            if (dist < playerTank.radius + d.radius) {
                if (d.type === 'hull') { PlayerProgress.inventory.hullUpgrades++; spawnText(d.x, d.y, "+1 Корпус", '#00ccff'); } 
                else { PlayerProgress.inventory.turretUpgrades++; spawnText(d.x, d.y, "+1 Башня", '#ff3333'); }
                PlayerProgress.collectedStars[currentLevelNum] = (PlayerProgress.collectedStars[currentLevelNum] || 0) + 1;
                drops.splice(i, 1);
            }
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; b.update(dt, arena, spawnSparks, () => playSound(bounceSound));
        if (b.toDestroy) continue; let hasHit = false;
        if (playerTank && playerTank.hp > 0 && b.ownerTank !== playerTank && b.lastHitTarget !== playerTank) {
            let hit = playerTank.checkHit(b);
            if (hit.hit) {
                hasHit = true;
                if (hit.type === 'penetration') { b.toDestroy = true; spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333'); playSound(hitSound); if (hit.destroyed) spawnExplosion(playerTank.x, playerTank.y); } 
                else { b.x = b.prevX; b.y = b.prevY; b.bounce(hit.nx, hit.ny); b.isDecaying = true; b.ownerTank = null; b.lastHitTarget = playerTank; spawnSparks(hit.x, hit.y, hit.nx, hit.ny); playSound(bounceSound); }
            }
        }
        if (!hasHit) {
            for (let enemy of enemies) {
                if (b.ownerTank === enemy || b.lastHitTarget === enemy) continue; 
                let hit = enemy.checkHit(b);
                if (hit.hit) {
                    if (hit.type === 'penetration') { b.toDestroy = true; spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333'); playSound(hitSound); if (hit.destroyed) spawnExplosion(enemy.x, enemy.y); } 
                    else { b.x = b.prevX; b.y = b.prevY; b.bounce(hit.nx, hit.ny); b.isDecaying = true; b.ownerTank = null; b.lastHitTarget = enemy; spawnSparks(hit.x, hit.y, hit.nx, hit.ny); playSound(bounceSound); }
                    break; 
                }
            }
        }
    }
    bullets = bullets.filter(b => !b.toDestroy);
    
    for (let i = sparks.length - 1; i >= 0; i--) { let s = sparks[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy *= 0.93; if (s.life <= 0) sparks.splice(i, 1); }
    for (let i = floatingTexts.length - 1; i >= 0; i--) { let ft = floatingTexts[i]; ft.life -= dt; ft.y += ft.vy * dt; if (ft.life <= 0) floatingTexts.splice(i, 1); }

    ctx.clearRect(0, 0, canvas.width, canvas.height); arena.draw(ctx);
    
    for (let d of drops) {
        ctx.shadowBlur = 15; ctx.shadowColor = d.type === 'hull' ? '#00ccff' : '#ff3333';
        ctx.fillStyle = d.type === 'hull' ? '#0055aa' : '#aa2222';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('★', d.x, d.y + 2);
    }

    for (let b of bullets) b.draw(ctx);
    for (let s of sparks) { ctx.fillStyle = `rgba(${s.color}, ${Math.max(0, s.life / s.maxLife)})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); }
    
    // ОТРИСОВКА ИГРОКА И ПОЛЕТА ДРОНА
    if (playerTank && playerTank.hp > 0) {
        playerTank.draw(ctx);
        if (playerTank.hullName === "Леопард") {
            if (playerTank.droneState === 'ready') {
                let dx = playerTank.x + Math.cos(playerTank.droneAngle) * 55; let dy = playerTank.y + Math.sin(playerTank.droneAngle) * 55;
                ctx.shadowBlur = 10; ctx.shadowColor = '#00ffcc'; ctx.fillStyle = '#00ffcc';
                ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            } else if (playerTank.droneState === 'attacking') {
                ctx.shadowBlur = 10; ctx.shadowColor = '#00ffcc'; ctx.fillStyle = '#00ffcc';
                ctx.beginPath(); ctx.arc(playerTank.droneX, playerTank.droneY, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
                // Красивый шлейф за дроном
                sparks.push({ x: playerTank.droneX, y: playerTank.droneY, vx: 0, vy: 0, life: 0.1, maxLife: 0.1, size: 2, color: '0, 255, 204' });
            }
            
            // Взрыв дрона при попадании
            if (playerTank.droneExplodeRequest) {
                playerTank.droneExplodeRequest = false;
                playSound(explodeSound);
                for (let i = 0; i < 30; i++) { 
                    let a = Math.random() * Math.PI * 2; let s = 50 + Math.random() * 150; 
                    sparks.push({ x: playerTank.droneX, y: playerTank.droneY, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.5+Math.random(), maxLife: 1.5, size: 3+Math.random()*6, color: '0, 255, 204' }); 
                }
            }
        }
    }

    // ОТРИСОВКА ВРАГОВ И ЭФФЕКТА СТАНА
    for (let e of enemies) {
        e.draw(ctx);
        if (e.isJustStunned) {
            e.isJustStunned = false; spawnText(e.x, e.y - 30, "ОГЛУШЕН!", '#00ffcc');
        }
        if (e.stunTimer > 0) {
            ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius + 5 + Math.sin(timestamp / 50) * 3, 0, Math.PI * 2); ctx.stroke();
        }
    }

    if (playerTank && playerTank.hp > 0) { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(`ХП: ${playerTank.hp} | Броня: Лоб ${playerTank.armor.front.current} | Борт ${playerTank.armor.side.current} | Корма ${playerTank.armor.rear.current}`, 15, 30); }
    
    ctx.font = '900 20px Arial, sans-serif'; ctx.textAlign = 'center';
    for (let ft of floatingTexts) { let alpha = Math.max(0, ft.life / ft.maxLife); ctx.globalAlpha = alpha; ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.strokeText(ft.text, ft.x, ft.y); ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y); }
    
    // ОТКЛЮЧЕНА белая обводка (убраны вызовы strokeText)
    if (playerTank.hp <= 0) { 
        ctx.font = '900 60px Arial'; ctx.fillStyle = '#ff0000'; ctx.textAlign = 'center'; 
        ctx.fillText('ТАНК УНИЧТОЖЕН', canvas.width / 2, canvas.height / 2); 
    } else if (levelFinished) { 
        ctx.font = '900 60px Arial'; ctx.fillStyle = '#00ff00'; ctx.textAlign = 'center'; 
        ctx.fillText('СЕКТОР ЗАЧИЩЕН!', canvas.width / 2, canvas.height / 2 - 20); 
        if (firstClearBonus) { 
            ctx.font = '900 35px Arial'; ctx.fillStyle = '#ffcc00'; 
            ctx.fillText('Первое прохождение: +5 ⚙️', canvas.width / 2, canvas.height / 2 + 40); 
        }
    }
    
    animFrameId = requestAnimationFrame(gameLoop);
}

initHangarUI(startLevel);
