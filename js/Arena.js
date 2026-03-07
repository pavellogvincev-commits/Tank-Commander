export class Arena {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // Препятствия (x, y, ширина, высота)
        this.obstacles = [
            { x: 200, y: 150, w: 100, h: 50 },
            { x: 500, y: 400, w: 50, h: 150 },
            { x: 100, y: 450, w: 150, h: 50 }
        ];
    }

    draw(ctx) {
        // Отрисовка границ (стены арены)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, this.width, this.height);

        // Отрисовка препятствий
        ctx.fillStyle = '#8b4513'; // Цвет кирпича/дерева
        for (const obs of this.obstacles) {
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }
    }

    // Простая проверка столкновений танка со стенами и препятствиями
    checkCollision(x, y, radius) {
        // Столкновение с границами карты
        if (x - radius < 0 || x + radius > this.width || 
            y - radius < 0 || y + radius > this.height) {
            return true;
        }

        // Столкновение с препятствиями (круговой коллайдер танка vs прямоугольник)
        for (const obs of this.obstacles) {
            // Ищем ближайшую точку прямоугольника к центру танка
            let testX = x;
            let testY = y;

            if (x < obs.x) testX = obs.x; // левый край
            else if (x > obs.x + obs.w) testX = obs.x + obs.w; // правый край

            if (y < obs.y) testY = obs.y; // верхний край
            else if (y > obs.y + obs.h) testY = obs.y + obs.h; // нижний край

            // Вычисляем расстояние от центра танка до этой точки
            let distX = x - testX;
            let distY = y - testY;
            let distance = Math.sqrt((distX*distX) + (distY*distY));

            if (distance <= radius) {
                return true; // Есть столкновение
            }
        }
        return false;
    }
}