export class Bullet {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner; // 'player' или 'enemy'
        
        this.speed = 500; 
        this.radius = 3;  
        this.toDestroy = false; 
        this.penetration = 80; 

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    // НОВЫЙ МЕТОД: Физический отскок пули от нормали (nx, ny)
    bounce(nx, ny) {
        let dotV = this.vx * nx + this.vy * ny;
        this.vx = this.vx - 2 * dotV * nx;
        this.vy = this.vy - 2 * dotV * ny;
        
        this.angle = Math.atan2(this.vy, this.vx);
        
        // Немного "выталкиваем" пулю, чтобы она не застряла в броне
        this.x += nx * 6;
        this.y += ny * 6;
        
        // После рикошета пуля становится "ничейной" и может ранить кого угодно!
        this.owner = null; 
    }

    update(dt, arena, spawnSparks) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        let col = arena.checkBulletCollision(this.x, this.y, this.radius);
        
        if (col.hit) {
            let dirX = this.vx / this.speed;
            let dirY = this.vy / this.speed;

            let dotProduct = -(dirX * col.nx + dirY * col.ny);
            dotProduct = Math.max(-1, Math.min(1, dotProduct)); 
            
            let angleOfIncidence = Math.acos(dotProduct) * (180 / Math.PI);

            if (angleOfIncidence >= 55) {
                // Вызываем наш новый метод отскока
                this.bounce(col.nx, col.ny);
                playSound(bounceSound);
            } else {
                this.toDestroy = true;
                if (spawnSparks) spawnSparks(this.x, this.y, col.nx, col.ny);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = '#ffaa00'; 
        ctx.shadowBlur = 10;       
        ctx.shadowColor = '#ff0000';
        ctx.fillRect(-6, -2, 12, 4); 
        
        ctx.restore();
    }
}

