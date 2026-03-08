import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 600;

const input = new Input(canvas);
const arena = new Arena(canvas.width, canvas.height);

const hullImage = new Image(); const turretImage = new Image();
const enemyHullImage = new Image(); const enemyTurretImage = new Image();

let playerTank;
let enemies = []; // Теперь враги будут в массиве!
let lastTime = 0;

let bullets = []; 
let sparks = [];

// --- НОВОЕ: Система всплывающего текста ---
let floatingTexts = [];

function spawnText(x, y, text, color) {
    floatingTexts.push({
        x: x, y: y,
        text: text, color: color,
        life: 1.5, maxLife: 1.5, // Живет полторы секунды
        vy: -30 // Летит вверх
    });
}

function spawnSparks(x, y, normalX, normalY) {
    let sparkCount = 5 + Math.floor(Math.random() * 6);
    let baseAngle = Math.atan2(normalY, normalX); 
    for (let i = 0; i < sparkCount; i++) {
        let spread = (Math.random() - 0.5) * Math.PI;
        let speed = 100 + Math.random() * 200; 
        sparks.push({
            x: x, y: y, vx: Math.cos(baseAngle + spread) * speed, vy: Math.sin(baseAngle + spread) * speed,
            life: 1.0, maxLife: 1.0, size: 2 + Math.random() * 3
        });
    }
}

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    if (playerTank.hp > 0) {
        playerTank.update(dt, input, arena);
        if (input.isShooting() && playerTank.tryShoot()) {
            const sx = playerTank.x + Math.cos(playerTank.turretAngle) * 35;
            const sy = playerTank.y + Math.sin(playerTank.turretAngle) * 35;
            bullets.push(new Bullet(sx, sy, playerTank.turretAngle, 'player'));
        }
    }

    // Обновляем всех живых врагов
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        if (enemy.hp > 0) {
            let wantsToShoot = enemy.updateAI(dt, arena, playerTank);
            if (wantsToShoot) {
                const sx = enemy.x + Math.cos(enemy.turretAngle) * 35;
                const sy = enemy.y + Math.sin(enemy.turretAngle) * 35;
                bullets.push(new Bullet(sx, sy, enemy.turretAngle, 'enemy'));
            }
        } else {
            enemies.splice(i, 1); // Удаляем мертвого врага
        }
    }

    // --- ЛОГИКА СТОЛКНОВЕНИЯ ПУЛЬ С ТАНКАМИ ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.update(dt, arena, spawnSparks);
        
        if (b.toDestroy) {
            bullets.splice(i, 1);
            continue;
        }

        // Проверяем попадание в Игрока
        if (b.owner !== 'player' && playerTank.hp > 0) {
            let hit = playerTank.checkHit(b);
            if (hit.hit) {
                b.toDestroy = true; // Пуля исчезает при любом касании танка
                if (hit.type === 'penetration') {
                    spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333');
                } else {
                    spawnText(hit.x, hit.y - 20, 'РИКОШЕТ', '#bbbbbb');
                    spawnSparks(hit.x, hit.y, -Math.cos(b.angle), -Math.sin(b.angle)); // Искры от брони
                }
            }
        }

        // Проверяем попадание во Врагов
        if (b.owner !== 'enemy') {
            for (let enemy of enemies) {
                let hit = enemy.checkHit(b);
                if (hit.hit) {
                    b.toDestroy = true;
                    if (hit.type === 'penetration') {
                        spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333');
                    } else {
                        spawnText(hit.x, hit.y - 20, 'РИКОШЕТ', '#bbbbbb');
                        spawnSparks(hit.x, hit.y, -Math.cos(b.angle), -Math.sin(b.angle));
                    }
                    break; // Пуля попала, дальше врагов не проверяем
                }
            }
        }
    }

    // Удаляем пули, которые врезались
    bullets = bullets.filter(b => !b.toDestroy);

    // Обновляем текст и искры
    for (let i = sparks.length - 1; i >= 0; i--) { ... /* старый код искр */ }
    
    // Анимация текста
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.life -= dt;
        ft.y += ft.vy * dt; // Текст летит вверх
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // --- ОТРИСОВКА ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    arena.draw(ctx);
    
    for (let bullet of bullets) bullet.draw(ctx);
    for (let s of sparks) { ... /* отрисовка искр */ }

    // Рисуем танки
    if (playerTank.hp > 0) playerTank.draw(ctx);
    for (let enemy of enemies) enemy.draw(ctx);

    // НОВОЕ: Рисуем всплывающий текст
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    for (let ft of floatingTexts) {
        let alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(ft.text, ft.x, ft.y);
        
        // Черная обводка для читаемости
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
        ctx.strokeText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(gameLoop);
}

// Загрузка
let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 4) {
        playerTank = new Tank(400, 300, hullImage, turretImage);
        // Закидываем врага в массив!
        enemies.push(new Enemy(100, 100, enemyHullImage, enemyTurretImage));
        requestAnimationFrame(gameLoop);
    }
}

hullImage.onload = onImageLoad;
turretImage.onload = onImageLoad;
enemyHullImage.onload = onImageLoad;
enemyTurretImage.onload = onImageLoad;

const noCache = '?v=' + new Date().getTime();
hullImage.src = 'assets/hull.png' + noCache;
turretImage.src = 'assets/turret.png' + noCache;
enemyHullImage.src = 'assets/enemy-hull.png' + noCache;
enemyTurretImage.src = 'assets/enemy-turret.png' + noCache;
