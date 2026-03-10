export class Arena {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.obstacles = [];
    }

    // НОВЫЙ МЕТОД: Генерация препятствий от 0 (нет) до 5 (очень много)
    generateObstacles(density) {
        this.obstacles = [];
        if (density <= 0) return;

        // Чем больше плотность, тем больше ящиков (допустим, плотность * 2)
        let count = density * 2; 

        for (let i = 0; i < count; i++) {
            let w = 80 + Math.random() * 100;
            let h = 40 + Math.random() * 60;
            // Случайно поворачиваем ящик (вертикально или горизонтально)
            if (Math.random() > 0.5) { let temp = w; w = h; h = temp; }

            // Спавним так, чтобы не забить края карты (оставляем отступы)
            let x = 100 + Math.random() * (this.width - 200 - w);
            let y = 100 + Math.random() * (this.height - 200 - h);

            this.obstacles.push({ x, y, w, h });
        }
    }

    checkCollision(x, y, radius) {
        for (let obs of this.obstacles) {
            let testX = x; let testY = y;
            if (x < obs.x) testX = obs.x; else if (x > obs.x + obs.w) testX = obs.x + obs.w;
            if (y < obs.y) testY = obs.y; else if (y > obs.y + obs.h) testY = obs.y + obs.h;

            let distX = x - testX; let distY = y - testY;
            if ((distX * distX) + (distY * distY) <= radius * radius) {
                return true;
            }
        }
        return false;
    }

    hasLineOfSight(x1, y1, x2, y2) {
        let dx = x2 - x1; let dy = y2 - y1;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let steps = Math.max(1, Math.ceil(dist / 10));
        for (let i = 1; i < steps; i++) {
            let px = x1 + dx * (i / steps); let py = y1 + dy * (i / steps);
            if (this.checkCollision(px, py, 1)) return false;
        }
        return true; 
    }

    draw(ctx) {
        for (let obs of this.obstacles) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.lineWidth = 4; ctx.strokeStyle = '#3e1f08';
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }
    }
}
