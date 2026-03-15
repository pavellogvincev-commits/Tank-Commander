export class Arena {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.obstacles = [];
        this.barrels = [];
    }

    generateObstacles(count, barrelCount = 0) {
        this.obstacles = [];
        this.barrels = [];
        let margin = 70;
        let minGap = 110; 
        let playerSpawn = { x: 500, y: 350, r: 120 }; 

        for (let i = 0; i < count; i++) {
            let w, h, x, y, valid, attempts = 0;
            do {
                valid = true;
                w = 80 + Math.random() * 150;
                h = 80 + Math.random() * 150;
                if (Math.random() > 0.5) { if (w > h) h = 80; else w = 80; }
                x = margin + Math.random() * (this.width - margin * 2 - w);
                y = margin + Math.random() * (this.height - margin * 2 - h);

                let rx = Math.max(x, Math.min(playerSpawn.x, x + w));
                let ry = Math.max(y, Math.min(playerSpawn.y, y + h));
                let distToPlayer = Math.sqrt(Math.pow(playerSpawn.x - rx, 2) + Math.pow(playerSpawn.y - ry, 2));
                if (distToPlayer < playerSpawn.r) valid = false;

                if (valid) {
                    for (let obs of this.obstacles) {
                        if (x < obs.x + obs.w + minGap && x + w + minGap > obs.x &&
                            y < obs.y + obs.h + minGap && y + h + minGap > obs.y) {
                            valid = false;
                            break;
                        }
                    }
                }
                attempts++;
            } while (!valid && attempts < 100);

            if (valid) this.obstacles.push({ x, y, w, h });
        }

        for (let i = 0; i < barrelCount; i++) {
            if (this.obstacles.length === 0) break;
            let obs = this.obstacles[Math.floor(Math.random() * this.obstacles.length)];
            let side = Math.floor(Math.random() * 4);
            let bx, by; let offset = 25;

            if (side === 0) { bx = obs.x + Math.random()*obs.w; by = obs.y - offset; } 
            else if (side === 1) { bx = obs.x + obs.w + offset; by = obs.y + Math.random()*obs.h; } 
            else if (side === 2) { bx = obs.x + Math.random()*obs.w; by = obs.y + obs.h + offset; } 
            else { bx = obs.x - offset; by = obs.y + Math.random()*obs.h; } 

            bx = Math.max(30, Math.min(this.width - 30, bx));
            by = Math.max(30, Math.min(this.height - 30, by));

            let distToPlayerBarrel = Math.sqrt(Math.pow(playerSpawn.x - bx, 2) + Math.pow(playerSpawn.y - by, 2));
            if (distToPlayerBarrel > playerSpawn.r) {
                // ОБНОВЛЕНО: Радиус 12 для картинки 24x24
                this.barrels.push({ x: bx, y: by, radius: 12 });
            }
        }
    }

    checkCollision(x, y, radius) {
        if (x - radius < 0 || x + radius > this.width || y - radius < 0 || y + radius > this.height) return true;
        for (let obs of this.obstacles) {
            let rx = Math.max(obs.x, Math.min(x, obs.x + obs.w));
            let ry = Math.max(obs.y, Math.min(y, obs.y + obs.h));
            let dist = Math.sqrt(Math.pow(x - rx, 2) + Math.pow(y - ry, 2));
            if (dist < radius) return true;
        }
        return false;
    }

    hasLineOfSight(x1, y1, x2, y2) {
        let dx = x2 - x1; let dy = y2 - y1; let dist = Math.sqrt(dx * dx + dy * dy);
        let steps = Math.ceil(dist / 10);
        for (let i = 1; i < steps; i++) {
            let t = i / steps; let cx = x1 + dx * t; let cy = y1 + dy * t;
            for (let obs of this.obstacles) {
                if (cx > obs.x && cx < obs.x + obs.w && cy > obs.y && cy < obs.y + obs.h) return false;
            }
        }
        return true;
    }

    draw(ctx, barrelImg) {
        ctx.fillStyle = '#9e5a26'; ctx.strokeStyle = '#5a310e'; ctx.lineWidth = 4;
        for (let obs of this.obstacles) {
            ctx.save(); 
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.restore(); 
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }

        // ОБНОВЛЕНО: Отрисовка спрайта бочки
        for (let b of this.barrels) {
            if (barrelImg && barrelImg.complete) {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
                ctx.drawImage(barrelImg, b.x - 12, b.y - 12, 24, 24);
                ctx.restore();
            } else {
                ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
}
