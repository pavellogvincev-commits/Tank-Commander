export class Bullet {
    // ВАЖНО: Вместо 'owner' теперь передаем 'ownerTank'
    constructor(x, y, angle, ownerTank, penetration, radius = 2.5, color = '#ffaa00') {
        this.x = x; this.y = y;
        this.prevX = x; this.prevY = y;
        
        this.angle = angle;
        this.ownerTank = ownerTank; // Запоминаем танк-создатель
        this.penetration = penetration;
        this.radius = radius;
        this.color = color;

        this.speed = 450; 
        this.toDestroy = false;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.isDecaying = false;
        this.maxDecayTime = 0.5;
        this.decayTimer = this.maxDecayTime;

        this.lastHitTarget = null; 
    }

    update(dt, arena, spawnSparks, bounceCallback) {
        this.prevX = this.x; this.prevY = this.y;

        if (this.isDecaying) {
            this.decayTimer -= dt;
            if (this.decayTimer <= 0) this.toDestroy = true;
            this.x += this.vx * dt; this.y += this.vy * dt;
            return; 
        }

        let nextX = this.x + this.vx * dt; let nextY = this.y + this.vy * dt;
        let hitWall = false; let nx = 0, ny = 0;

        if (nextX < 0) { hitWall = true; nx = 1; ny = 0; this.x = 0; }
        else if (nextX > arena.width) { hitWall = true; nx = -1; ny = 0; this.x = arena.width; }
        else if (arena.checkCollision(nextX, this.y, this.radius)) { hitWall = true; nx = -Math.sign(this.vx); ny = 0; } 
        else { this.x = nextX; }

        if (nextY < 0) { hitWall = true; nx = 0; ny = 1; this.y = 0; }
        else if (nextY > arena.height) { hitWall = true; nx = 0; ny = -1; this.y = arena.height; }
        else if (arena.checkCollision(this.x, nextY, this.radius)) { hitWall = true; nx = 0; ny = -Math.sign(this.vy); } 
        else { this.y = nextY; }

        if (hitWall) {
            this.bounce(nx, ny); this.isDecaying = true; this.lastHitTarget = null; 
            if (spawnSparks) spawnSparks(this.x, this.y, nx, ny);
            if (bounceCallback) bounceCallback();
        }
    }

    bounce(nx, ny) {
        let dot = this.vx * nx + this.vy * ny;
        this.vx = this.vx - 2 * dot * nx; this.vy = this.vy - 2 * dot * ny;
        this.angle = Math.atan2(this.vy, this.vx);
    }

        draw(ctx) {
        // ОБНОВЛЕНО: Тень от пули (летит чуть выше земли)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y + 4, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Свечение и сама пуля
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Сбрасываем свечение
    }
}

