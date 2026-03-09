export class Bullet {
    // НОВОЕ: Добавили аргументы radius и color
    constructor(x, y, angle, owner, penetration, radius = 2.5, color = '#ffaa00') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
        this.speed = 600; // Чуть увеличили скорость для динамики
        
        this.radius = radius; // Индивидуальный размер пули
        this.color = color;   // Индивидуальный цвет
        
        this.toDestroy = false;
        this.penetration = penetration;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(dt, arena) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Уничтожение пули, если она улетела за карту
        if (this.x < 0 || this.x > arena.width || this.y < 0 || this.y > arena.height) {
            this.toDestroy = true;
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
        
        // Рисуем светящийся след (трассер) сзади пули
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-this.radius * 6, -this.radius * 0.8, this.radius * 6, this.radius * 1.6);
        
        // Рисуем саму пулю (круг)
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
