import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js'; // <-- НОВОЕ

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

// --- НОВОЕ: Массив для хранения всех летящих снарядов ---
let bullets = []; 

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    // 1. Обновляем логику танка
    playerTank.update(dt, input, arena);

    // --- НОВОЕ: ЛОГИКА СТРЕЛЬБЫ ---
    // Если игрок зажал мышь И танк готов выстрелить (прошел кулдаун)
    if (input.isShooting() && playerTank.tryShoot()) {
        
        // Вычисляем длину ствола (расстояние от центра танка до конца пушки)
        // Подбери это число под свою картинку башни. Я поставил 35.
        const barrelLength = 35; 
        
        // Математика: находим координаты кончика ствола
        const spawnX = playerTank.x + Math.cos(playerTank.turretAngle) * barrelLength;
        const spawnY = playerTank.y + Math.sin(playerTank.turretAngle) * barrelLength;

        // Создаем новый снаряд и добавляем его в массив
        bullets.push(new Bullet(spawnX, spawnY, playerTank.turretAngle));
    }

    // Обновляем все снаряды
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(dt, arena);
        
        // Если снаряд врезался во что-то - удаляем его из массива
        if (bullets[i].toDestroy) {
            bullets.splice(i, 1);
        }
    }

    // 2. Отрисовка
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    arena.draw(ctx);
    
    // Рисуем снаряды ПОД башней, но НАД корпусом/землей
    for (let bullet of bullets) {
        bullet.draw(ctx);
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

// Не забываем про трюк с кэшем, если будешь менять картинки
const noCache = '?v=' + new Date().getTime();
hullImage.src = 'assets/hull.png' + noCache;
turretImage.src = 'assets/turret.png' + noCache;
