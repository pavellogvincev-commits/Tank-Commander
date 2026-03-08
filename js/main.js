import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js'; // <-- ИМПОРТИРУЕМ ВРАГА

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const input = new Input(canvas);
const arena = new Arena(canvas.width, canvas.height);

// Картинки игрока
const hullImage = new Image();
const turretImage = new Image();
// Картинки врага
const enemyHullImage = new Image();
const enemyTurretImage = new Image();

let playerTank;
let enemyTank; // <-- Переменная для врага
let lastTime = 0;

let bullets = []; 
let sparks = [];

function spawnSparks(x, y, normalX, normalY) {
    let sparkCount = 5 + Math.floor(Math.random() * 6);
    let baseAngle = Math.atan2(normalY, normalX); 

    for (let i = 0; i < sparkCount; i++) {
        let spread = (Math.random() - 0.5) * Math.PI;
        let finalAngle = baseAngle + spread;
        let speed = 100 + Math.random() * 200; 

        sparks.push({
            x: x, y: y,
            vx: Math.cos(finalAngle) * speed, vy: Math.sin(finalAngle) * speed,
            life: 1.0, maxLife: 1.0, size: 2 + Math.random() * 3
        });
    }
}

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    // 1. Обновляем ИГРОКА
    playerTank.update(dt, input, arena);

    // 2. Обновляем ВРАГА
    // Передаем ему игрока, чтобы он знал, куда целиться
    let enemyWantsToShoot = enemyTank.updateAI(dt, arena, playerTank);

    // Выстрел игрока
    if (input.isShooting() && playerTank.tryShoot()) {
        const spawnX = playerTank.x + Math.cos(playerTank.turretAngle) * 35;
        const spawnY = playerTank.y + Math.sin(playerTank.turretAngle) * 35;
        bullets.push(new Bullet(spawnX, spawnY, playerTank.turretAngle));
    }

    // Выстрел врага
    if (enemyWantsToShoot) {
        const spawnX = enemyTank.x + Math.cos(enemyTank.turretAngle) * 35;
        const spawnY = enemyTank.y + Math.sin(enemyTank.turretAngle) * 35;
        bullets.push(new Bullet(spawnX, spawnY, enemyTank.turretAngle));
    }

    // Обновляем снаряды
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(dt, arena, spawnSparks);
        if (bullets[i].toDestroy) bullets.splice(i, 1);
    }

    // Обновляем искры
    for (let i = sparks.length - 1; i >= 0; i--) {
        let s = sparks[i];
        s.life -= dt * 4; 
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.vx *= 0.9; s.vy *= 0.9;
        if (s.life <= 0) sparks.splice(i, 1);
    }

    // ОТРИСОВКА
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    arena.draw(ctx);
    
    for (let bullet of bullets) bullet.draw(ctx);
    
    for (let s of sparks) {
        let alpha = Math.max(0, s.life / s.maxLife);
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`; 
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Рисуем танки
    enemyTank.draw(ctx);
    playerTank.draw(ctx);

    requestAnimationFrame(gameLoop);
}

// Загрузка ЧЕТЫРЕХ картинок
let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 4) { // Ждем все 4 файла
        playerTank = new Tank(400, 300, hullImage, turretImage);
        
        // Спавним врага где-нибудь в левом верхнем углу
        enemyTank = new Enemy(100, 100, enemyHullImage, enemyTurretImage);
        
        requestAnimationFrame(gameLoop);
    }
}

hullImage.onload = onImageLoad;
turretImage.onload = onImageLoad;
enemyHullImage.onload = onImageLoad;
enemyTurretImage.onload = onImageLoad;

// Очистка кэша
const noCache = '?v=' + new Date().getTime();
hullImage.src = 'assets/hull.png' + noCache;
turretImage.src = 'assets/turret.png' + noCache;
enemyHullImage.src = 'assets/enemy-hull.png' + noCache; // Твоя картинка корпуса врага
enemyTurretImage.src = 'assets/enemy-turret.png' + noCache; // Твоя картинка башни врага
