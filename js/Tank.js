export class Tank {
    // 1. Добавляем картинки в аргументы конструктора
    constructor(x, y, hullImg, turretImg) {
        this.x = x;
        this.y = y;
        this.radius = 20;

        // Сохраняем картинки внутри танка
        this.hullImg = hullImg;
        this.turretImg = turretImg;

        // Размеры картинок при отрисовке (можешь поменять под свои)
        this.hullWidth = 60;
        this.hullHeight = 45;
        this.turretWidth = 60;
        this.turretHeight = 45;

        // Характеристики Корпуса
        this.hullSpeed = 100;
        this.hullRotationSpeed = 1;
        this.hullAngle = 0;

        // Характеристики Башни
        this.turretRotationSpeed = 4;
        this.turretAngle = 0;
    }

    // Метод update ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ, его не трогаем
    update(dt, input, arena) {
        /* ... весь старый код движения и поворота ... */
        // (Оставь его как было)
        // --- ДВИЖЕНИЕ КОРПУСА ---
        if (input.isLeft()) this.hullAngle -= this.hullRotationSpeed * dt;
        if (input.isRight()) this.hullAngle += this.hullRotationSpeed * dt;

        let moveSpeed = 0;
        if (input.isForward()) moveSpeed = this.hullSpeed;
        if (input.isBackward()) moveSpeed = -this.hullSpeed * 0.6; 

        if (moveSpeed !== 0) {
            let nextX = this.x + Math.cos(this.hullAngle) * moveSpeed * dt;
            let nextY = this.y + Math.sin(this.hullAngle) * moveSpeed * dt;

            if (!arena.checkCollision(nextX, nextY, this.radius)) {
                this.x = nextX;
                this.y = nextY;
            } else if (!arena.checkCollision(nextX, this.y, this.radius)) {
                this.x = nextX;
            } else if (!arena.checkCollision(this.x, nextY, this.radius)) {
                this.y = nextY; 
            }
        }

        // --- ПОВОРОТ БАШНИ ---
        let targetTurretAngle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
        let angleDiff = targetTurretAngle - this.turretAngle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

        if (Math.abs(angleDiff) > 0.01) {
            let rotationStep = this.turretRotationSpeed * dt;
            if (Math.abs(angleDiff) < rotationStep) {
                this.turretAngle = targetTurretAngle; 
            } else {
                this.turretAngle += Math.sign(angleDiff) * rotationStep;
            }
        }
    }

    draw(ctx) {
        // Отрисовка КОРПУСА
        ctx.save();
        ctx.translate(this.x, this.y); // Перемещаем центр координат в центр танка
        ctx.rotate(this.hullAngle);    // Поворачиваем холст
        
        // Рисуем картинку корпуса.
        // Почему минус половина ширины и высоты? 
        // Потому что точка отрисовки у картинки - это верхний левый угол. 
        // Смещая на половину влево и вверх, мы центрируем картинку.
        ctx.drawImage(
            this.hullImg, 
            -this.hullWidth / 2, 
            -this.hullHeight / 2, 
            this.hullWidth, 
            this.hullHeight
        );
        ctx.restore();

        // Отрисовка БАШНИ
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        
        ctx.drawImage(
            this.turretImg, 
            -this.turretWidth / 2, // "+ 5" смещает башню чуть назад, если центр вращения башни не ровно по центру картинки (поэкспериментируй с этой цифрой)
            -this.turretHeight / 2, 
            this.turretWidth, 
            this.turretHeight
        );
        ctx.restore();
    }
}





