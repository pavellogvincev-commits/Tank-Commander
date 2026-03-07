export class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        
        this.speed = 400; // Скорость полета снаряда
        this.radius = 3;  // Размер снаряда (для коллизий)
        this.toDestroy = false; // Флаг, что снаряд попал в стену и его надо удалить
    }

    update(dt, arena) {
        // Двигаем снаряд вперед по его углу
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        // Проверяем столкновение со стенами/препятствиями арены
        if (arena.checkCollision(this.x, this.y, this.radius)) {
            this.toDestroy = true; // Если врезался - помечаем на удаление
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Рисуем снаряд как вытянутую светящуюся пулю
        ctx.fillStyle = '#ffaa00'; // Оранжевый цвет
        ctx.shadowBlur = 10;       // Легкое свечение
        ctx.shadowColor = '#ff0000';
        ctx.fillRect(-6, -2, 12, 4); 
        
        ctx.restore();
    }
}