import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const input = new Input(canvas);
const arena = new Arena(canvas.width, canvas.height);

// 1. Создаем объекты изображений
const hullImage = new Image();
const turretImage = new Image();

// Переменная для хранения самого танка
let playerTank;
let lastTime = 0;

// 2. Функция игрового цикла (та же самая)
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    playerTank.update(dt, input, arena);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    arena.draw(ctx);
    playerTank.draw(ctx);

    requestAnimationFrame(gameLoop);
}

// 3. Создаем систему предзагрузки
let imagesLoaded = 0;

// Эта функция сработает каждый раз, когда загружается одна картинка
function onImageLoad() {
    imagesLoaded++;
    // У нас 2 картинки. Если загрузились обе — стартуем!
    if (imagesLoaded === 2) {
        // Создаем танк и передаем ему загруженные картинки
        playerTank = new Tank(400, 300, hullImage, turretImage);
        
        // Запускаем игру
        requestAnimationFrame(gameLoop);
    }
}

// Привязываем функцию к событию загрузки картинок
hullImage.onload = onImageLoad;
turretImage.onload = onImageLoad;

// 4. Указываем пути к файлам картинок
// Как только мы присвоим src, браузер начнет их скачивать из папки assets
hullImage.src = 'assets/hull.png';
turretImage.src = 'assets/turret.png';
