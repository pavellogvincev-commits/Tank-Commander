import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js';

// --- БАЗА ДАННЫХ ДЕТАЛЕЙ (Характеристики) ---
const GameData = {
    hulls: {
        "hunter": { name: "Охотник", hp: 200, armor: { front: 80, side: 40, rear: 25 }, speed: 50 }
    },
    turrets: {
        "scourge": { name: "Плеть", fireRate: 1.0, penetration: 80 }
    },
    // В будущем сможем добавить сюда корпуса врагов
    enemyHulls: {
        "basic": { name: "Враг-Корпус", hp: 100, armor: { front: 60, side: 30, rear: 15 }, speed: 30 }
    },
    enemyTurrets: {
        "basic": { name: "Враг-Пушка", fireRate: 2.0, penetration: 60 }
    }
};

// Текущая сборка игрока
let currentAssembly = {
    hullId: "hunter",
    turretId: "scourge"
};

// --- ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА АНГАРА ---
function updateHangarUI() {
    let hData = GameData.hulls[currentAssembly.hullId];
    let tData = GameData.turrets[currentAssembly.turretId];

    document.getElementById('stat-hp').innerText = hData.hp;
    document.getElementById('stat-armor').innerText = `${hData.armor.front} / ${hData.armor.side} / ${hData.armor.rear}`;
    document.getElementById('stat-speed').innerText = hData.speed;
    document.getElementById('stat-firerate').innerText = tData.fireRate + " сек";
    document.getElementById('stat-penetration').innerText = tData.penetration;
}

// Вызываем сразу при загрузке страницы
updateHangarUI();

// Обработчик кнопки В БОЙ
document.getElementById('battle-btn').addEventListener('click', () => {
    // 1. Скрываем ангар, показываем Canvas
    document.getElementById('hangar-screen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    
    // 2. Инициализируем и запускаем игру!
    startGame();
});


// ==========================================
// ЛОГИКА ИГРЫ (Бывший основной код)
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 600;

const input = new Input(canvas);
const arena = new Arena(canvas.width, canvas.height);

const hullImage = new Image(); const turretImage = new Image();
const enemyHullImage = new Image(); const enemyTurretImage = new Image();

const shootSound = new Audio('assets/sounds/shoot.mp3');
const hitSound = new Audio('assets/sounds/hit.mp3');
const bounceSound = new Audio('assets/sounds/bounce.mp3');
const explodeSound = new Audio('assets/sounds/explode.mp3'); 

shootSound.volume = 0.3; hitSound.volume = 0.6; bounceSound.volume = 0.5; explodeSound.volume = 0.8;

function playSound(audio) { let c = audio.cloneNode(); c.volume = audio.volume; c.play().catch(e=>{}); }

let playerTank;
let enemies = []; 
let lastTime = 0;
let bullets = []; 
let sparks = [];
let floatingTexts = [];
let gameRunning = false; // Флаг работы цикла

function spawnText(x, y, text, color) { floatingTexts.push({ x: x, y: y, text: text, color: color, life: 1.5, maxLife: 1.5, vy: -30 }); }

function spawnSparks(x, y, nx, ny) {
    let count = 5 + Math.floor(Math.random() * 6);
    let base = Math.atan2(ny, nx); 
    for(let i=0; i<count; i++) {
        let spread = (Math.random() - 0.5) * Math.PI;
        let s = 100 + Math.random() * 200; 
        sparks.push({ x, y, vx: Math.cos(base+spread)*s, vy: Math.sin(base+spread)*s, life: 0.2+Math.random()*0.2, maxLife: 0.4, size: 2+Math.random()*3, color: '255, 200, 0' });
    }
}

function spawnExplosion(x, y) {
    playSound(explodeSound);
    let colors = ['255, 50, 0', '255, 150, 0', '100, 100, 100', '40, 40, 40']; 
    for(let i=0; i<100; i++) {
        let a = Math.random() * Math.PI * 2; 
        let s = 50 + Math.random() * 350;
        sparks.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1.5+Math.random()*2.0, maxLife: 3.5, size: 10+Math.random()*25, color: colors[Math.floor(Math.random()*colors.length)] });
    }
}

// Эта функция запускается по кнопке "В БОЙ"
function startGame() {
    // Берем данные для игрока из текущей сборки в ангаре
    let pStatsHull = GameData.hulls[currentAssembly.hullId];
    let pStatsTurret = GameData.turrets[currentAssembly.turretId];
    
    playerTank = new Tank(400, 300, hullImage, turretImage, pStatsHull, pStatsTurret);

    // Данные для врага
    let eStatsHull = GameData.enemyHulls["basic"];
    let eStatsTurret = GameData.enemyTurrets["basic"];
    
    enemies = [ new Enemy(100, 100, enemyHullImage, enemyTurretImage, eStatsHull, eStatsTurret) ];
    
    // Очищаем мусор, если бой перезапускается
    bullets = []; sparks = []; floatingTexts = [];
    lastTime = performance.now();
    gameRunning = true;
    
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    if (playerTank && playerTank.hp > 0) {
        playerTank.update(dt, input, arena);
        if (input.isShooting() && playerTank.tryShoot()) {
            const sx = playerTank.x + Math.cos(playerTank.turretAngle) * 35;
            const sy = playerTank.y + Math.sin(playerTank.turretAngle) * 35;
            // НОВОЕ: Передаем пробитие пушки в снаряд
            bullets.push(new Bullet(sx, sy, playerTank.turretAngle, 'player', playerTank.penetration));
            playSound(shootSound);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        if (enemy.hp > 0) {
            if (enemy.updateAI(dt, arena, playerTank)) {
                const sx = enemy.x + Math.cos(enemy.turretAngle) * 35;
                const sy = enemy.y + Math.sin(enemy.turretAngle) * 35;
                bullets.push(new Bullet(sx, sy, enemy.turretAngle, 'enemy', enemy.penetration));
                playSound(shootSound);
            }
        } else enemies.splice(i, 1); 
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.update(dt, arena, spawnSparks, () => playSound(bounceSound));
        if (b.toDestroy) continue; 
        
        let hasHit = false;

        if (b.owner !== 'player' && playerTank && playerTank.hp > 0) {
            let hit = playerTank.checkHit(b);
            if (hit.hit) {
                hasHit = true;
                if (hit.type === 'penetration') {
                    b.toDestroy = true; 
                    spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333'); playSound(hitSound);
                    if (hit.destroyed) spawnExplosion(playerTank.x, playerTank.y);
                } else {
                    b.bounce(hit.nx, hit.ny); spawnSparks(hit.x, hit.y, hit.nx, hit.ny); playSound(bounceSound);
                }
            }
        }

        if (!hasHit && !b.toDestroy && b.owner !== 'enemy') {
            for (let enemy of enemies) {
                let hit = enemy.checkHit(b);
                if (hit.hit) {
                    if (hit.type === 'penetration') {
                        b.toDestroy = true;
                        spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333'); playSound(hitSound);
                        if (hit.destroyed) spawnExplosion(enemy.x, enemy.y);
                    } else {
                        b.bounce(hit.nx, hit.ny); spawnSparks(hit.x, hit.y, hit.nx, hit.ny); playSound(bounceSound);
                    }
                    break; 
                }
            }
        }
    }

    bullets = bullets.filter(b => !b.toDestroy);

    for (let i = sparks.length - 1; i >= 0; i--) { 
        let s = sparks[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy *= 0.93;
        if (s.life <= 0) sparks.splice(i, 1);
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i]; ft.life -= dt; ft.y += ft.vy * dt; 
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // --- ОТРИСОВКА ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    arena.draw(ctx);
    for (let bullet of bullets) bullet.draw(ctx);
    for (let s of sparks) { 
        ctx.fillStyle = `rgba(${s.color}, ${Math.max(0, s.life / s.maxLife)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    }
    if (playerTank && playerTank.hp > 0) playerTank.draw(ctx);
    for (let enemy of enemies) enemy.draw(ctx);

    ctx.font = '900 20px Arial, sans-serif'; ctx.textAlign = 'center';
    for (let ft of floatingTexts) {
        let alpha = Math.max(0, ft.life / ft.maxLife); ctx.globalAlpha = alpha;
        ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;

    if (playerTank && playerTank.hp <= 0) {
        ctx.font = '900 50px Arial'; ctx.fillStyle = '#ff0000'; ctx.textAlign = 'center';
        ctx.lineWidth = 5; ctx.strokeStyle = '#000000';
        ctx.strokeText('ТАНК УНИЧТОЖЕН', canvas.width / 2, canvas.height / 2);
        ctx.fillText('ТАНК УНИЧТОЖЕН', canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(gameLoop);
}

// Загрузка картинок вынесена вниз (мы не ждем их для запуска ангара, браузер закэширует)
const noCache = '?v=' + new Date().getTime();
hullImage.src = 'assets/hull.png' + noCache;
turretImage.src = 'assets/turret.png' + noCache;
enemyHullImage.src = 'assets/enemy-hull.png' + noCache;
enemyTurretImage.src = 'assets/enemy-turret.png' + noCache;
