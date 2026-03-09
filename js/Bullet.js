export class Bullet {
    constructor(x, y, angle, owner, penetration) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner; 
        
        this.speed = 500; 
        this.radius = 3;  
        this.toDestroy = false; 
        
        this.penetration = penetration; // Получаем от танка!

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.isDecaying = false; 
        this.maxDecayTime = 0.5; 
        this.decayTimer = this.maxDecayTime;
    }

    bounce(nx, ny) {
        let dotV = this.vx * nx + this.vy * ny;
        this.vx = this.vx - 2 * dotV * nx;
        this.vy = this.vy - 2 * dotV * ny;
        
        this.angle = Math.atan2(this.vy, this.vx);
        
        this.x += nx * 6;
        this.y += ny * 6;
        
        this.owner = null; 

        // --- НОВОЕ: Включаем таймер угасания при ЛЮБОМ рикошете ---
        if (!this.isDecaying) {
            this.isDecaying = true;
        }
    }

    update(dt, arena, spawnSparks, playBounceSound) {
        // --- НОВОЕ: Логика угасания ---
        if (this.isDecaying) {
            this.decayTimer -= dt; // Таймер тикает вниз
            
            // Замедляем пулю, чтобы визуально показать потерю энергии (по желанию)
            // this.speed *= 0.98; 
            // this.vx = Math.cos(this.angle) * this.speed;
            // this.vy = Math.sin(this.angle) * this.speed;

            if (this.decayTimer <= 0) {
                this.toDestroy = true; // Время вышло, пуля растворилась
                return; // Прекращаем расчеты
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        let col = arena.checkBulletCollision(this.x, this.y, this.radius);
        
        if (col.hit) {
            // ТВОЯ ИДЕЯ: Пуля ВСЕГДА рикошетит от стен арены (убрали проверку угла)
            this.bounce(col.nx, col.ny);
            
            if (playBounceSound) playBounceSound();
            if (spawnSparks) spawnSparks(this.x, this.y, col.nx, col.ny); // Высекаем искры об стену
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // --- НОВОЕ: Визуальное исчезновение ---
        if (this.isDecaying) {
            // Высчитываем прозрачность (от 1.0 до 0.0)
            ctx.globalAlpha = Math.max(0, this.decayTimer / this.maxDecayTime);
        }
        
        ctx.fillStyle = '#ffaa00'; 
        ctx.shadowBlur = 10;       
        ctx.shadowColor = '#ff0000';
        ctx.fillRect(-6, -2, 12, 4); 
        
        ctx.restore(); // ctx.restore() автоматически сбросит globalAlpha обратно
    }
}

