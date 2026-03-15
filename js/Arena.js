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
        let margin = 100;

        for (let i = 0; i < count; i++) {
            let w = 80 + Math.random() * 150;
            let h = 80 + Math.random() * 150;
            if (Math.random() > 0.5) { if (w > h) h = 80; else w = 80; }
            let x = margin + Math.random() * (this.width - margin * 2 - w);
            let y = margin + Math.random() * (this.height - margin * 2 - h);
            this.obstacles.push({ x, y, w, h });
        }

        // Спавн бочек рядом с ящиками
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

            this.barrels.push({ x: bx, y: by, radius: 14 });
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

    draw(ctx) {
        ctx.fillStyle = '#9e5a26'; ctx.strokeStyle = '#5a310e'; ctx.lineWidth = 4;
        for (let obs of this.obstacles) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.shadowColor = 'transparent'; ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }

        // Отрисовка бочек
        for (let b of this.barrels) {
            ctx.fillStyle = '#cc0000'; ctx.strokeStyle = '#660000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffaa00'; ctx.fillRect(b.x - 3, b.y - 3, 6, 6); // Предупреждающий знак
        }
    }
}
