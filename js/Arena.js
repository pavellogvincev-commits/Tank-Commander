export class Arena {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.obstacles = [];
    }

    generateObstacles(density) {
        this.obstacles = [];
        if (density <= 0) return;

        let count = density; 
        let minGap = 70; 
        let centerX = 400, centerY = 300, safeR = 80;

        for (let i = 0; i < count; i++) {
            let w, h;
            
            // ОБНОВЛЕНО: Разнообразие форм блоков
            let type = Math.random();
            if (type < 0.3) { 
                // Маленькие колонны-столбы
                w = 40 + Math.random() * 20; h = 40 + Math.random() * 20; 
            } else if (type < 0.7) { 
                // Длинные тонкие стены
                w = 120 + Math.random() * 100; h = 30 + Math.random() * 20; 
            } else { 
                // Массивные бункеры
                w = 80 + Math.random() * 60; h = 80 + Math.random() * 60; 
            }

            if (Math.random() > 0.5) { let temp = w; w = h; h = temp; }

            let x, y, valid, attempts = 0;
            do {
                valid = true;
                
                // Кидаем блок в случайную точку карты
                x = Math.random() * (this.width - w);
                y = Math.random() * (this.height - h);

                // ОБНОВЛЕНО: ПРИЛИПАНИЕ К СТЕНАМ (если щель меньше 70px)
                if (x < 70) x = 0; // Прилипнуть к левой стене
                else if (this.width - (x + w) < 70) x = this.width - w; // К правой

                if (y < 70) y = 0; // К верхней
                else if (this.height - (y + h) < 70) y = this.height - h; // К нижней

                // Проверка: не попали ли в центр (на игрока)
                if (x < centerX + safeR && x + w > centerX - safeR &&
                    y < centerY + safeR && y + h > centerY - safeR) {
                    valid = false;
                    attempts++;
                    continue;
                }

                // Проверка: не пересекаемся ли с другими блоками (с учетом minGap)
                for (let obs of this.obstacles) {
                    if (x < obs.x + obs.w + minGap && x + w > obs.x - minGap &&
                        y < obs.y + obs.h + minGap && y + h > obs.y - minGap) {
                        valid = false;
                        break;
                    }
                }
                attempts++;
            } while (!valid && attempts < 500);

            if (valid) {
                this.obstacles.push({ x, y, w, h });
            }
        }
    }

    checkCollision(x, y, radius) {
        if (x - radius < 0 || x + radius > this.width || y - radius < 0 || y + radius > this.height) return true;
        for (let obs of this.obstacles) {
            let testX = x; let testY = y;
            if (x < obs.x) testX = obs.x; else if (x > obs.x + obs.w) testX = obs.x + obs.w;
            if (y < obs.y) testY = obs.y; else if (y > obs.y + obs.h) testY = obs.y + obs.h;
            let distX = x - testX; let distY = y - testY;
            if ((distX * distX) + (distY * distY) <= radius * radius) return true;
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
            ctx.fillStyle = '#8B4513'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.lineWidth = 4; ctx.strokeStyle = '#3e1f08'; ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }
    }
}
