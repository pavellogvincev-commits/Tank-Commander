export class Bullet {
    // ОБНОВЛЕНО: добавлен параметр speed
    constructor(x, y, angle, ownerTank, penetration, radius, color, speed) {
        this.x = x; this.y = y; 
        this.vx = Math.cos(angle) * speed; 
        this.vy = Math.sin(angle) * speed;
        this.ownerTank = ownerTank; 
        this.penetration = penetration; 
        this.radius = radius; 
        this.color = color;
        
        this.toDestroy = false; 
        this.isDecaying = false; 
        this.decayTimer = 0.4; 
        
        this.prevX = x; this.prevY = y;
        this.lastHitTarget = null;
    }

    update(dt, arena, spawnSparks, playBounceSound) {
        if (this.toDestroy) return;

        if (this.isDecaying) {
            this.decayTimer -= dt;
            this.x += this.vx * dt; this.y += this.vy * dt;
            if (this.decayTimer <= 0) this.toDestroy = true;
        } else {
            this.prevX = this.x; this.prevY = this.y;
            this.x += this.vx * dt; this.y += this.vy * dt;

            if (arena.checkCollision(this.x, this.y, this.radius)) {
                this.x = this.prevX; this.y = this.prevY;
                let nx = 0, ny = 0;
                if (arena.checkCollision(this.x + this.vx * dt, this.y, this.radius)) nx = -Math.sign(this.vx);
                if (arena.checkCollision(this.x, this.y + this.vy * dt, this.radius)) ny = -Math.sign(this.vy);
                if (nx === 0 && ny === 0) { nx = -Math.sign(this.vx); ny = -Math.sign(this.vy); }
                
                this.bounce(nx, ny);
                this.isDecaying = true; 
                this.ownerTank = null; 
                this.lastHitTarget = null; 
                
                spawnSparks(this.x, this.y, nx, ny);
                playBounceSound();
            }
        }
    }

    bounce(nx, ny) {
        let dot = this.vx * nx + this.vy * ny;
        this.vx = this.vx - 2 * dot * nx;
        this.vy = this.vy - 2 * dot * ny;
        this.vx *= 0.6; this.vy *= 0.6; 
    }

    draw(ctx) {
        if (this.toDestroy) return;
        ctx.save();
        
        let alpha = this.isDecaying ? Math.max(0, this.decayTimer / 0.4) : 1.0;
        ctx.globalAlpha = alpha;

        ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * alpha})`;
        ctx.beginPath(); ctx.arc(this.x + 4, this.y + 4, this.radius, 0, Math.PI * 2); ctx.fill();

        ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        
        ctx.restore();
    }
}
