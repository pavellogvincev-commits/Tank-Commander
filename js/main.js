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

// --- ЗВУКИ ---
const shootSound = new Audio('assets/sounds/shoot.mp3');
const hitSound = new Audio('assets/sounds/hit.mp3');
const bounceSound = new Audio('assets/sounds/bounce.mp3');
// НОВЫЙ ЗВУК ВЗРЫВА
const explodeSound = new Audio('assets/sounds/explode.mp3'); 

shootSound.volume = 0.3;
hitSound.volume = 0.6;
bounceSound.volume = 0.3;
explodeSound.volume = 0.8; // Взрыв должен быть громким!

function playSound(audioObject) {
    let clone = audioObject.cloneNode(); 
    clone.volume = audioObject.volume;   
    clone.play().catch(e => console.log("Ждем клика игрока")); 
}

let playerTank;
let enemies = []; 
let lastTime = 0;

let bullets = []; 
let sparks = [];
let floatingTexts = [];

function spawnText(x, y, text, color) {
    floatingTexts.push({ x: x, y: y, text: text, color: color, life: 1.5, maxLife: 1.5, vy: -30 });
}

// Обновленная функция искр (теперь поддерживает цвета)
function spawnSparks(x, y, normalX, normalY) {
    let sparkCount = 5 + Math.floor(Math.random() * 6);
    let baseAngle = Math.atan2(normalY, normalX); 
    for (let i = 0; i < sparkCount; i++) {
        let spread = (Math.random() - 0.5) * Math.PI;
        let speed = 100 + Math.random() * 200; 
        sparks.push({
            x: x, y: y, 
            vx: Math.cos(baseAngle + spread) * speed, vy: Math.sin(baseAngle + spread) * speed,
            life: 0.2 + Math.random() * 0.2, // Искры живут доли секунды
            maxLife: 0.4, 
            size: 2 + Math.random() * 3,
            color: '255, 200, 0' 
        });
    }
}

// НОВАЯ ФУНКЦИЯ: Огромный взрыв танка!
function spawnExplosion(x, y) {
    playSound(explodeSound);
    
    let colors = ['255, 50, 0', '255, 150, 0', '100, 100, 100', '40, 40, 40']; 
    
    for (let i = 0; i < 100; i++) { // Увеличили со 40 до 100 частиц!
        let angle = Math.random() * Math.PI * 2; 
        let speed = 50 + Math.random() * 350; // Разлетаются в 1.5 раза дальше
        sparks.push({
            x: x, y: y, 
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 1.5 + Math.random() * 2.0,  // Дым живет от 1.5 до 3.5 СЕКУНД
            maxLife: 3.5, 
            size: 10 + Math.random() * 25, // Частицы стали ОГРОМНЫМИ (до 35 пикселей)
            color: colors[Math.floor(Math.random() * colors.length)] 
        });
    }
}

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    if (playerTank && playerTank.hp > 0) {
        playerTank.update(dt, input, arena);
        if (input.isShooting() && playerTank.tryShoot()) {
            const sx = playerTank.x + Math.cos(playerTank.turretAngle) * 35;
            const sy = playerTank.y + Math.sin(playerTank.turretAngle) * 35;
            bullets.push(new Bullet(sx, sy, playerTank.turretAngle, 'player'));
            playSound(shootSound);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        if (enemy.hp > 0) {
            let wantsToShoot = enemy.updateAI(dt, arena, playerTank);
            if (wantsToShoot) {
                const sx = enemy.x + Math.cos(enemy.turretAngle) * 35;
                const sy = enemy.y + Math.sin(enemy.turretAngle) * 35;
                bullets.push(new Bullet(sx, sy, enemy.turretAngle, 'enemy'));
                playSound(shootSound);
            }
        } else {
            enemies.splice(i, 1); 
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        
        b.update(dt, arena, spawnSparks, () => playSound(bounceSound));
        if (b.toDestroy) continue; 
        
        let hasHit = false;

        // Попадание в игрока
        if (b.owner !== 'player' && playerTank && playerTank.hp > 0) {
            let hit = playerTank.checkHit(b);
            if (hit.hit) {
                hasHit = true;
                if (hit.type === 'penetration') {
                    b.toDestroy = true; 
                    spawnText(hit.x, hit.y - 20, `-${hit.damage}`, '#ff3333');
                    playSound(hitSound);
                    
                    // ЕСЛИ УБИЛИ ИГРОКА
                    if (hit.destroyed) {
                        spawnExplosion(playerTank.x, playerTank.y); // Взрыв ровно по центру танка
                    }
                } else {
                    b.bounce(hit.nx, hit.ny);
                    spawnSparks(hit.x, hit.y, hit.nx, hit.ny); 
                    playSound(bounceSound);
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
                        playSound(hitSound);
                        
                        // ЕСЛИ УБИЛИ ВРАГА
                        if (hit.destroyed) {
                            spawnExplosion(enemy.x, enemy.y); // Взрыв ровно по центру врага
                        }
                    } else {
                        b.bounce(hit.nx, hit.ny);
                        spawnSparks(hit.x, hit.y, hit.nx, hit.ny);
                        playSound(bounceSound);
                    }
                    break; 
                }
            }
        }
    }

    bullets = bullets.filter(b => !b.toDestroy);

    for (let i = sparks.length - 1; i >= 0; i--) { 
        let s = sparks[i];
        s.life -= dt; 
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.vx *= 0.93; s.vy *= 0.93;
        if (s.life <= 0) sparks.splice(i, 1);
    }
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.life -= dt;
        ft.y += ft.vy * dt; 
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // --- ОТРИСОВКА ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    arena.draw(ctx);
    for (let bullet of bullets) bullet.draw(ctx);
    
    // Отрисовка частиц (теперь цветная!)
    for (let s of sparks) { 
        let alpha = Math.max(0, s.life / s.maxLife);
        ctx.fillStyle = `rgba(${s.color}, ${alpha})`; // Использует s.color вместо жестко заданного цвета
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }

    if (playerTank && playerTank.hp > 0) playerTank.draw(ctx);
    for (let enemy of enemies) enemy.draw(ctx);

    ctx.font = '900 22px Arial, sans-serif'; 
    ctx.textAlign = 'center';
    for (let ft of floatingTexts) {
        let alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;

    // --- НОВОЕ: НАДПИСЬ GAME OVER ---
    if (playerTank && playerTank.hp <= 0) {
        ctx.font = '900 50px Arial';
        ctx.fillStyle = '#ff0000'; // Красный цвет
        ctx.textAlign = 'center';
        
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000000'; // Черная обводка
        ctx.strokeText('ТАНК УНИЧТОЖЕН', canvas.width / 2, canvas.height / 2);
        ctx.fillText('ТАНК УНИЧТОЖЕН', canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(gameLoop);
}

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

const noCache = '?v=' + new Date().getTime();
hullImage.src = 'assets/hull.png' + noCache;
turretImage.src = 'assets/turret.png' + noCache;
enemyHullImage.src = 'assets/enemy-hull.png' + noCache;
enemyTurretImage.src = 'assets/enemy-turret.png' + noCache;


