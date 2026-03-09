export class Bullet {
    constructor(x, y, angle, owner, penetration, radius = 2.5, color = '#ffaa00') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
        this.penetration = penetration;
        this.radius = radius;
        this.color = color;

        this.speed = 450; // СТРОГО 450
        this.toDestroy = false;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        // ВЕРНУЛИ ЛОГИКУ ЗАТУХАНИЯ
        this.isDecaying = false;
        this.maxDecayTime = 0.5;
        this.decayTimer = this.maxDecayTime;
    }

    update(dt, arena, spawnSparks, bounceCallback) {
        // Если пуля уже отскочила и затухает
        if (this.isDecaying) {
            this.decayTimer -= dt;
            if (this.decayTimer <= 0) this.toDestroy = true;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            return; 
        }

        let nextX = this.x + this.vx * dt;
        let nextY = this.y + this.vy * dt;

        let hitWall = false;
        let nx = 0, ny = 0;

        // ВЕРНУЛИ СТОЛКНОВЕНИЯ СО СТЕНАМИ АРЕНЫ
        if (nextX < 0) { hitWall = true; nx = 1; ny = 0; this.x = 0; }
        else if (nextX > arena.width) { hitWall = true; nx = -1; ny = 0; this.x = arena.width; }
        else { this.x = nextX; }

        if (nextY < 0) { hitWall = true; nx = 0; ny = 1; this.y = 0; }
        else if (nextY > arena.height) { hitWall = true; nx = 0; ny = -1; this.y = arena.height; }
        else { this.y = nextY; }

        if (hitWall) {
            this.bounce(nx, ny);
            this.isDecaying = true; // Начинает исчезать
            if (spawnSparks) spawnSparks(this.x, this.y, nx, ny);
            if (bounceCallback) bounceCallback();
        }
    }

    bounce(nx, ny) {
        let dot = this.vx * nx + this.vy * ny;
        this.vx = this.vx - 2 * dot * nx;
        this.vy = this.vy - 2 * dot * ny;
        this.angle = Math.atan2(this.vy, this.vx);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Прозрачность зависит от таймера затухания
        let alpha = this.isDecaying ? Math.max(0, this.decayTimer / this.maxDecayTime) : 1.0;
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha * 0.5;
        // След (трассер)
        ctx.fillRect(-this.radius * 6, -this.radius * 0.8, this.radius * 6, this.radius * 1.6);
        
        ctx.globalAlpha = alpha;
        // Сама пуля
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
