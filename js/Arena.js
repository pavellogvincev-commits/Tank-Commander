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
        
        // ПРОСВЕТ 70 пикселей (танк 54px, проедет легко)
        let minGap = 70; 
        
        let centerX = 400, centerY = 300, safeR = 80;

        for (let i = 0; i < count; i++) {
            // Чуть более компактные блоки, чтобы влезало много
            let sideA = 50 + Math.random() * 70;  // Макс длина 120
            let sideB = 40 + Math.random() * 40;  // Макс толщина 80
            
            let w = sideA;
            let h = sideB;
            if (Math.random() > 0.5) { w = sideB; h = sideA; }

            let x, y, valid, attempts = 0;
            do {
                valid = true;
                
                // РАСШИРИЛИ ЗОНУ СПАВНА: отступ от краев арены теперь 50 пикселей (а не 100)
                x = 50 + Math.random() * (this.width - 100 - w);
                y = 50 + Math.random() * (this.height - 100 - h);

                if (x < centerX + safeR && x + w > centerX - safeR &&
                    y < centerY + safeR && y + h > centerY - safeR) {
                    valid = false;
                    attempts++;
                    continue;
                }

                for (let obs of this.obstacles) {
                    if (x < obs.x + obs.w + minGap && x + w > obs.x - minGap &&
                        y < obs.y + obs.h + minGap && y + h > obs.y - minGap) {
                        valid = false;
                        break;
                    }
                }
                attempts++;
            } while (!valid && attempts < 500); // Алгоритм будет очень упорно искать место (500 попыток)

            // Ставим ящик, только если нашли для него подходящее место
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
