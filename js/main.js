import { Input } from './Input.js';
import { Arena } from './Arena.js';
import { Tank } from './Tank.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Задаем размер арены
canvas.width = 800;
canvas.height = 600;

// Инициализация систем
const input = new Input(canvas);
const arena = new Arena(canvas.width, canvas.height);
const playerTank = new Tank(400, 300); // Спавн в центре

let lastTime = 0;

function gameLoop(timestamp) {
    // Вычисляем Delta Time (в секундах) для независимости от FPS
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;

    // Обновление логики
    playerTank.update(dt, input, arena);

    // Очистка экрана
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовка
    arena.draw(ctx);
    playerTank.draw(ctx);

    // Запрашиваем следующий кадр
    requestAnimationFrame(gameLoop);
}

// Запускаем игру
requestAnimationFrame(gameLoop);