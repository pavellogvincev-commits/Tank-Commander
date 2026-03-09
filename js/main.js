import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js';

// --- БАЗА ДАННЫХ И ПРОГРЕСС ---
const GameData = {
    hulls: { "hunter": { hp: 200, armor: { front: 80, side: 40, rear: 25 }, speed: 50 } },
    turrets: { "scourge": { fireRate: 1.0, penetration: 80 } },
    enemyHulls: { "basic": { hp: 100, armor: { front: 60, side: 30, rear: 15 }, speed: 30 } },
    enemyTurrets: { "basic": { fireRate: 2.0, penetration: 60 } }
};

// Сохраняем прогресс игрока (в будущем можно сохранять в localStorage)
let PlayerProgress = {
    unlockedLevel: 1 // Максимально доступный уровень
};

// Конфигурация уровней (пока опишем только Уровень 1)
const LevelsConfig = {
    1: { totalEnemies: 4, enemyType: "basic", bonuses: 2 }
    // Уровни 2-100 пока будут пустышками (просто для теста сетки)
};

// --- ИНТЕРФЕЙС ---
const screens = {
    hangar: document.getElementById('hangar-screen'),
    levels: document.getElementById('levels-screen'),
    game: document.getElementById('gameCanvas')
};

function showScreen(screenName) {
    screens.hangar.style.display = screenName === 'hangar' ? 'flex' : 'none';
    screens.levels.style.display = screenName === 'levels' ? 'flex' : 'none';
    screens.game.style.display = screenName === 'game' ? 'block' : 'none';
}

document.getElementById('to-levels-btn').addEventListener('click', () => {
    generateLevelsGrid();
    showScreen('levels');
});

document.getElementById('back-to-hangar-btn').addEventListener('click', () => {
    showScreen('hangar');
});

// Генерация 100 кнопок уровней
function generateLevelsGrid() {
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = ''; 

    for (let i = 1; i <= 100; i++) {
        let btn = document.createElement('button');
        btn.className = 'level-btn ' + (i <= PlayerProgress.unlockedLevel ? 'unlocked' : 'locked');
        
        let levelName = `<div>${i}</div>`;
        let bonuses = i === 1 ? `<div class="bonuses">★ ★</div>` : ''; // Пример звездочек бонуса
        
        btn.innerHTML = levelName + bonuses;
        
        if (i <= PlayerProgress.unlockedLevel) {
            btn.onclick = () => startLevel(i);
        }
        grid.appendChild(btn);
    }
}


// ==========================================
// ЛОГИКА ИГРЫ (ДВИЖОК)
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 600;

const input = new Input(canvas);
const arena = new Arena(canvas.width, canvas.height);

const hullImage = new Image(); const turretImage = new Image();
const enemyHullImage = new Image(); const enemyTurretImage = new Image();

// Звуки (заглушки для чистоты кода, если нет файлов - ошибки не сломают игру)
function playSound() {}

let playerTank;
let enemies = []; 
let bullets = []; 
let sparks = [];
let floatingTexts = [];

let lastTime = 0;
let gameRunning = false;

// ПЕРЕМЕННЫЕ ТЕКУЩЕГО УРОВНЯ
let currentLevelNum = 1;
let enemiesToSpawn = 0;
let enemySpawnTimer = 0;
let levelFinished = false;

// Запуск конкретного уровня
function startLevel(levelNum) {
    currentLevelNum = levelNum;
    let config = LevelsConfig[levelNum] || { totalEnemies: 1, enemyType: "basic", bonuses: 0 }; // Дефолт, если уровень еще не описан
    
    enemiesToSpawn = config.totalEnemies;
    enemySpawnTimer = 0; // Первый враг появляется сразу
    levelFinished = false;

    let pStatsHull = GameData.hulls["hunter"];
    let pStatsTurret = GameData.turrets["scourge"];
    playerTank = new Tank(400, 300, hullImage, turretImage, pStatsHull, pStatsTurret);
    
    enemies = []; bullets = []; sparks = []; floatingTexts = [];
    
    showScreen('game');
    lastTime = performance.now();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

// Функция поиска безопасного места (подальше от игрока)
function spawnEnemyOnArena() {
    let safeDistance = 200;
    let spawnX, spawnY;
    let attempts = 0;

    // Ищем случайные координаты, пока они не будут достаточно далеко от игрока и не в стене
    do {
        spawnX = 50 + Math.random() * (canvas.width - 100);
        spawnY = 50 + Math.random() * (canvas.height - 100);
        
        let dx = spawnX - playerTank.x;
        let dy = spawnY - playerTank.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > safeDistance && !arena.checkCollision(spawnX, spawnY, 25)) {
            break; // Нашли идеальное место
        }
        attempts++;
    } while (attempts < 50); // Защита от бесконечного цикла

    let eStatsHull = GameData.enemyHulls["basic"];
    let eStatsTurret = GameData.enemyTurrets["basic"];
    
    enemies.push(new Enemy(spawnX, spawnY, enemyHullImage, enemyTurretImage, eStatsHull, eStatsTurret));
}


function gameLoop(timestamp) {
    if (!gameRunning) return;
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    // --- ЛОГИКА ПОЯВЛЕНИЯ ВРАГОВ (ТВОЙ АЛГОРИТМ) ---
    if (enemiesToSpawn > 0 && playerTank.hp > 0 && !levelFinished) {
        // Если врагов на поле нет, таймер обнуляется принудительно
        if (enemies.length === 0) {
            enemySpawnTimer = 0;
        } else {
            enemySpawnTimer -= dt;
        }

        if (enemySpawnTimer <= 0) {
            spawnEnemyOnArena();
            enemiesToSpawn--;
            // Формула: 20 сек + (танки на поле * 20)
            enemySpawnTimer = 20 + (enemies.length * 20);
        }
    }

    // --- ПРОВЕРКА ПОБЕДЫ ---
    if (enemiesToSpawn === 0 && enemies.length === 0 && playerTank.hp > 0 && !levelFinished) {
        levelFinished = true;
        
        // Разблокируем следующий уровень, если это нужно
        if (PlayerProgress.unlockedLevel === currentLevelNum) {
            PlayerProgress.unlockedLevel++;
        }
        
        // Через 3 секунды после победы выходим в меню
        setTimeout(() => {
            gameRunning = false;
            generateLevelsGrid();
            showScreen('levels');
        }, 3000);
    }

    // --- ПРОВЕРКА ПОРАЖЕНИЯ ---
    if (playerTank.hp <= 0 && !levelFinished) {
        levelFinished = true;
        setTimeout(() => {
            gameRunning = false;
            showScreen('hangar'); // При смерти выкидываем в ангар чинить танк
        }, 3000);
    }

    // Обновление игрока
    if (playerTank.hp > 0) {
        playerTank.update(dt, input, arena);
        if (input.isShooting() && playerTank.tryShoot()) {
            const sx = playerTank.x + Math.cos(playerTank.turretAngle) * 35;
            const sy = playerTank.y + Math.sin(playerTank.turretAngle) * 35;
            bullets.push(new Bullet(sx, sy, playerTank.turretAngle, 'player', playerTank.penetration));
        }
    }

    // Обновление врагов
    for (let i =.owner !== 'enemy') {
            for (let enemy of enemies) {
                let hit = enemy.checkHit(b);
                if (hit.hit) { b.toDestroy = true; break; }
            }
        }
    }
    bullets = bullets.filter(b => !b.toDestroy);

    // ОТРИСОВКА
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    arena.draw(ctx);
    for (let bullet of bullets) bullet.draw(ctx);
    if (playerTank && playerTank.hp > 0) playerTank.draw(ctx);
    for (let enemy of enemies) enemy.draw(ctx);

    // Тексты победы/поражения
    if (playerTank.hp <= 0) {
        ctx.font = '900 50px Arial'; ctx.fillStyle = '#ff0000'; ctx.textAlign = 'center';
        ctx.fillText('ТАНК УНИЧТОЖЕН', canvas.width / 2, canvas.height / 2);
    } else if (levelFinished) {
        ctx.font = '900 50px Arial'; ctx.fillStyle = '#00ff00'; ctx.textAlign = 'center';
        ctx.fillText('СЕКТОР ЗАЧИЩЕН!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Arial'; ctx.fillStyle = '#fff';
        ctx.fillText('Возвращение на базу...', canvas.width / 2, canvas.height / 2 + 20);
    }

    requestAnimationFrame(gameLoop);
}

// Загрузка
const noCache = '?v=' + new Date().getTime();
hullImage.src = 'assets/hull.png' + noCache;
turretImage.src = 'assets/turret.png' + noCache;
enemyHullImage.src = 'assets/enemy-hull.png' + noCache;
enemyTurretImage.src = 'assets/enemy-turret.png' + noCache;
