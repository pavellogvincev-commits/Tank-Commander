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
        let minGap = 100; // Просвет увеличен, чтобы огромные блоки не заблокировали всё
        
        let centerX = 500, centerY = 350, safeR = 120; // Безопасная зона тоже больше

        for (let i = 0; i < count; i++) {
            let w, h;
            let type = Math.random();
            // ОБНОВЛЕНО: ОГРОМНЫЕ РАЗМЕРЫ
            if (type < 0.3) { 
                // Квадратные колонны (от 80x80 до 120x120)
                w = 80 + Math.random() * 40; h = 80 + Math.random() * 40; 
            } 
            else if (type < 0.7) { 
                // Очень длинные стены (от 200 до 400 пикселей в длину!)
                w = 200 + Math.random() * 200; h = 40 + Math.random() * 30; 
            } 
            else { 
                // Массивные бункеры (от 150x150 до 250x250)
                w = 150 + Math.random() * 100; h = 150 + Math.random() * 100; 
            }
            
            if (Math.random() > 0.5) { let temp = w; w = h; h = temp; }

            let x, y, valid, attempts = 0;
            do {
                valid = true;
                x = Math.random() * (this.width - w);
                y = Math.random() * (this.height - h);

                if (x < 70) x = 0; else if (this.width - (x + w) < 70) x = this.width - w; 
                if (y < 70) y = 0; else if (this.height - (y + h) < 70) y = this.height - h; 

                if (x < centerX + safeR && x + w > centerX - safeR && y < centerY + safeR && y + h > centerY - safeR) {
                    valid = false; attempts++; continue;
                }

                for (let obs of this.obstacles) {
                    if (x < obs.x + obs.w + minGap && x + w > obs.x - minGap && y < obs.y + obs.h + minGap && y + h > obs.y - minGap) {
                        valid = false; break;
                    }
                }
                attempts++;
            } while (!valid && attempts < 1000); // Поиск места для больших блоков сложнее, даем 1000 попыток

            if (valid) this.obstacles.push({ x, y, w, h });
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
            // ОБНОВЛЕНО: Тень ящика (смещение на 8 пикселей вправо-вниз)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(obs.x + 8, obs.y + 8, obs.w, obs.h);

            // Сам ящик
            ctx.fillStyle = '#8B4513'; 
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.lineWidth = 4; ctx.strokeStyle = '#3e1f08'; 
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }
    }
}

