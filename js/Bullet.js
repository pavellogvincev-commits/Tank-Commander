export class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        
        this.speed = 400; 
        this.radius = 3;  
        this.toDestroy = false; 

        // Теперь мы храним скорость по осям X и Y для удобства рикошета
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    // Добавили функцию spawnSparks, которую передадим из main.js
    update(dt, arena, spawnSparks) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        let col = arena.checkBulletCollision(this.x, this.y, this.radius);
        
        if (col.hit) {
            // Вычисляем угол падения (между вектором полета и нормалью стены)
            // Нормализуем текущий вектор скорости
            let dirX = this.vx / this.speed;
            let dirY = this.vy / this.speed;

            // Dot Product (Скалярное произведение)
            let dotProduct = -(dirX * col.nx + dirY * col.ny);
            // Ограничиваем от -1 до 1 для безопасности математики
            dotProduct = Math.max(-1, Math.min(1, dotProduct)); 
            
            // Получаем угол в градусах (0 - прямо в лоб, 90 - по касательной)
            let angleOfIncidence = Math.acos(dotProduct) * (180 / Math.PI);

            if (angleOfIncidence >= 55) {
                // РИКОШЕТ! Формула отражения вектора
                let dotV = this.vx * col.nx + this.vy * col.ny;
                this.vx = this.vx - 2 * dotV * col.nx;
                this.vy = this.vy - 2 * dotV * col.ny;
                
                // Обновляем визуальный угол снаряда
                this.angle = Math.atan2(this.vy, this.vx);

                // Чуть-чуть сдвигаем снаряд от стены, чтобы он не застрял внутри
                this.x += col.nx * 2;
                this.y += col.ny * 2;
            } else {
                // ВЗРЫВ О СТЕНУ (Угол меньше 45 градусов)
                this.toDestroy = true;
                // Создаем искры, которые полетят в сторону нормали (от стены)
                if (spawnSparks) {
                    spawnSparks(this.x, this.y, col.nx, col.ny);
                }
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

