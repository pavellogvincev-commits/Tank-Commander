import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const input = new Input(canvas);
const arena = new Arena(canvas.width, canvas.height);

const hullImage = new Image();
const turretImage = new Image();

let playerTank;
let lastTime = 0;

let bullets = []; 

// --- НОВОЕ: Массив для искр при попадании ---
let sparks = [];

// --- НОВОЕ: Функция создания искр ---
function spawnSparks(x, y, normalX, normalY) {
    // Создаем от 5 до 10 искр
    let sparkCount = 5 + Math.floor(Math.random() * 6);
    let baseAngle = Math.atan2(normalY, normalX); // Искры летят в сторону от стены

    for (let i = 0; i < sparkCount; i++) {
        // Даем искрам случайный разброс (около 90 градусов)
        let spread = (Math.random() - 0.5) * Math.PI;
        let finalAngle = baseAngle + spread;
        let speed = 100 + Math.random() * 200; // Быстрый разлет

        sparks.push({
            x: x,
            y: y,
            vx: Math.cos(finalAngle) * speed,
            vy: Math.sin(finalAngle) * speed,
            life: 1.0,     // Живут долю секунды
            maxLife: 1.0,
            size: 2 + Math.random() * 3
        });
    }
}

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    playerTank.update(dt, input, arena);

    if (input.isShooting() && playerTank.tryShoot()) {
        const barrelLength = 35; 
        const spawnX = playerTank.x + Math.cos(playerTank.turretAngle) * barrelLength;
        const spawnY = playerTank.y + Math.sin(playerTank.turretAngle) * barrelLength;
        bullets.push(new Bullet(spawnX, spawnY, playerTank.turretAngle));
    }

    // Обновляем снаряды и передаем им функцию создания искр
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(dt, arena, spawnSparks);
        
        if (bullets[i].toDestroy) {
            bullets.splice(i, 1);
        }
    }

    // --- НОВОЕ: Обновляем искры ---
    for (let i = sparks.length - 1; i >= 0; i--) {
        let s = sparks[i];
        s.life -= dt * 4; // Искры гаснут очень быстро
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        
        // Добавим легкое трение, чтобы они замедлялись
        s.vx *= 0.9;
        s.vy *= 0.9;

        if (s.life <= 0) sparks.splice(i, 1);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    arena.draw(ctx);
    
    // Рисуем снаряды
    for (let bullet of bullets) {
        bullet.draw(ctx);
    }

    // --- НОВОЕ: Рисуем искры ---
    for (let s of sparks) {
        let alpha = Math.max(0, s.life / s.maxLife);
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`; // Ярко-желтые искры
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }

    playerTank.draw(ctx);

    requestAnimationFrame(gameLoop);
}

let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        playerTank = new Tank(400, 300, hullImage, turretImage);
        requestAnimationFrame(gameLoop);
    }
}

hullImage.onload = onImageLoad;
turretImage.onload = onImageLoad;

const noCache = '?v=' + new Date().getTime();
hullImage.src = 'assets/hull.png' + noCache;
turretImage.src = 'assets/turret.png' + noCache;
