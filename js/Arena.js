export class Arena {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        this.obstacles = [
            { x: 200, y: 150, w: 100, h: 50 },
            { x: 500, y: 400, w: 50, h: 150 },
            { x: 100, y: 450, w: 150, h: 50 }
        ];
    }

    draw(ctx) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#8b4513'; 
        for (const obs of this.obstacles) {
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }
    }

    // Старый метод для танка оставляем как есть!
    checkCollision(x, y, radius) {
        if (x - radius < 0 || x + radius > this.width || 
            y - radius < 0 || y + radius > this.height) return true;

        for (const obs of this.obstacles) {
            let testX = x; let testY = y;
            if (x < obs.x) testX = obs.x; 
            else if (x > obs.x + obs.w) testX = obs.x + obs.w; 
            if (y < obs.y) testY = obs.y; 
            else if (y > obs.y + obs.h) testY = obs.y + obs.h; 

            let distX = x - testX; let distY = y - testY;
            if (Math.sqrt((distX*distX) + (distY*distY)) <= radius) return true;
        }
        return false;
    }

    // --- НОВОЕ: Продвинутая проверка для рикошетов снарядов ---
    checkBulletCollision(x, y, radius) {
        // Проверка границ экрана
        if (x - radius <= 0) return { hit: true, nx: 1, ny: 0 };           // Левая стена
        if (x + radius >= this.width) return { hit: true, nx: -1, ny: 0 }; // Правая стена
        if (y - radius <= 0) return { hit: true, nx: 0, ny: 1 };           // Верхняя стена
        if (y + radius >= this.height) return { hit: true, nx: 0, ny: -1 };// Нижняя стена

        // Проверка препятствий
        for (const obs of this.obstacles) {
            let testX = x; let testY = y;

            if (x < obs.x) testX = obs.x; 
            else if (x > obs.x + obs.w) testX = obs.x + obs.w; 
            if (y < obs.y) testY = obs.y; 
            else if (y > obs.y + obs.h) testY = obs.y + obs.h; 

            let dx = x - testX;
            let dy = y - testY;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                if (distance === 0) return { hit: true, nx: 1, ny: 0 }; // Защита от деления на ноль
                // Возвращаем нормаль (вектор, перпендикулярный поверхности)
                return { hit: true, nx: dx / distance, ny: dy / distance };
            }
        }
        return { hit: false };
    }
}
