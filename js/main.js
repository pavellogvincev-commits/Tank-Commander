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

// Картинки
const hullImage = new Image(); const turretImage = new Image();
const enemyHullImage = new Image(); const enemyTurretImage = new Image();

let playerTank;
let enemies = []; 
let lastTime = 0;

let bullets = []; 
let sparks = [];
let floatingTexts = [];

// Создание текста урона
function spawnText(x, y, text, color) {
    floatingTexts.push({
        x: x, y: y,
        text: text, color: color,
        life: 1.5, maxLife: 1.5, // Текст висит 1.5 секунды
        vy: -30 // Медленно летит вверх
    });
}

// Создание искр при рикошете или попадании в стену
function spawnSparks(x, y, normalX, normalY) {
    let sparkCount = 5 + Math.floor(Math.random() * 6);
    let baseAngle = Math.atan2(normalY, normalX); 
    for (let i = 0; i < sparkCount; i++) {
        let spread = (Math.random() - 0.5) * Math.PI;
        let speed = 100 + Math.random() * 200; 
        sparks.push({
            x: x, y: y, 
            vx: Math.cos(baseAngle + spread) * speed, 
            vy: Math.sin(baseAngle + spread) * speed,
            life: 1.0, maxLife: 1.0, size: 2 + Math.random() * 3
        });
    }
}

// Главный игровой цикл
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    // 1. Обновляем Игрока
    if (playerTank.hp > 0) {
        playerTank.update(dt, input, arena);
        if (input.isShooting() && playerTank.tryShoot()) {
            const sx = playerTank.x + Math.cos(playerTank.turretAngle) * 35;
            const sy = playerTank.y + Math.sin(playerTank.turretAngle) * 35;
            bullets.push(new Bullet(sx, sy, playerTank.turretAngle, 'player'));
        }
    }

    // 2. Обновляем Врагов
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
            enemies.splice(i, 1); // Удаляем мертвых
        }
    }

    // 3. Обновляем Пули (и проверяем столкновения с танками)
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        
        // Сначала двигаем пулю и проверяем стены
        b.update(dt, arena, spawnSparks);
        
        if (b.toDestroy) continue; // Если взорвалась об стену, дальше не проверяем
        
        let hasHit = false;

        // Попадание в игрока
        if (b.owner !== 'player' && playerTank.hp > 0) {
            let hit = playerTank.checkHit(b);
            if (hit.
