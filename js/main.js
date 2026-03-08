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

// --- НОВОЕ: Загрузка звуков ---
const shootSound = new Audio('assets/sounds/shoot.mp3');
const hitSound = new Audio('assets/sounds/hit.mp3');
const bounceSound = new Audio('assets/sounds/bounce.mp3');

// Можно сразу настроить громкость (от 0.0 до 1.0), чтобы звуки не оглушали
shootSound.volume = 0.6;
hitSound.volume = 0.6;
bounceSound.volume = 0.4;

// Специальная функция для правильного проигрывания звуков (с наложением)
function playSound(audioObject) {
    let clone = audioObject.cloneNode(); // Создаем копию звука
    clone.volume = audioObject.volume;   // Переносим громкость
    // play() может вызвать ошибку, если игрок еще не кликнул по экрану (защита браузеров), поэтому ставим catch
    clone.play().catch(e => console.log("Ждем клика игрока для звука")); 
}

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
            if (hit.hit) {
                hasHit = true;
                if (hit.type === 'penetration') {
                    b.toDestroy = true; 
                    spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333');
                } else {
                    // Рикошет: пуля отскакивает от брони
                    b.bounce(hit.nx, hit.ny);
                    spawnSparks(hit.x, hit.y, hit.nx, hit.ny); 
                }
            }
        }

        // Попадание во врагов
        if (!hasHit && !b.toDestroy && b.owner !== 'enemy') {
            for (let enemy of enemies) {
                let hit = enemy.checkHit(b);
                if (hit.hit) {
                    if (hit.type === 'penetration') {
                        b.toDestroy = true;
                        spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333');
                    } else {
                        // Рикошет от врага
                        b.bounce(hit.nx, hit.ny);
                        spawnSparks(hit.x, hit.y, hit.nx, hit.ny);
                    }
                    break; // В двух врагов одновременно пуля попасть не может
                }
            }
        }
    }

    // Удаляем из массива пули, помеченные на уничтожение
    bullets = bullets.filter(b => !b.toDestroy);

    // 4. Обновляем Искры
    for (let i = sparks.length - 1; i >= 0; i--) { 
        let s = sparks[i];
        s.life -= dt * 4; 
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.vx *= 0.9; s.vy *= 0.9;
        if (s.life <= 0) sparks.splice(i, 1);
    }
    
    // 5. Обновляем Текст урона
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.life -= dt;
        ft.y += ft.vy * dt; 
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // --- ОТРИСОВКА ВСЕГО ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Арена
    arena.draw(ctx);
    
    // Снаряды
    for (let bullet of bullets) bullet.draw(ctx);
    
    // Искры
    for (let s of sparks) { 
        let alpha = Math.max(0, s.life / s.maxLife);
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`; 
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Танки
    if (playerTank.hp > 0) playerTank.draw(ctx);
    for (let enemy of enemies) enemy.draw(ctx);

    // Всплывающий текст урона (жирный шрифт с белой обводкой)
    ctx.font = '900 18px Arial, sans-serif'; // 900 - самый жирный вес
    ctx.textAlign = 'center';
    
    for (let ft of floatingTexts) {
        let alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.globalAlpha = alpha;
        
        // 1. Белая обводка (толщина 4px)
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(ft.text, ft.x, ft.y);
        
        // 2. Красная заливка самого текста
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0; // Возвращаем нормальную прозрачность

    requestAnimationFrame(gameLoop);
}

// Загрузка ресурсов
let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 4) {
        playerTank = new Tank(400, 300, hullImage, turretImage);
        enemies.push(new Enemy(100, 100, enemyHullImage, enemyTurretImage));
        requestAnimationFrame(gameLoop);
    }
}

hullImage.onload = onImageLoad;
turretImage.onload = onImageLoad;
enemyHullImage.onload = onImageLoad;
enemyTurretImage.onload = onImageLoad;

// Хак для сброса кэша браузера (чтобы картинки всегда были свежими)
const noCache = '?v=' + new Date().getTime();
hullImage.src = 'assets/hull.png' + noCache;
turretImage.src = 'assets/turret.png' + noCache;
enemyHullImage.src = 'assets/enemy-hull.png' + noCache;
enemyTurretImage.src = 'assets/enemy-turret.png' + noCache;


