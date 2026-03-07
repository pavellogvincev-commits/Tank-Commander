export class Tank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20; // Радиус для коллизий

        // Характеристики Корпуса (Hull)
        this.hullSpeed = 150; // пикселей в секунду
        this.hullRotationSpeed = 3; // радиан в секунду
        this.hullAngle = 0; // 0 смотрит вправо

        // Характеристики Башни (Turret)
        this.turretRotationSpeed = 4; // радиан в секунду
        this.turretAngle = 0;
    }

    update(dt, input, arena) {
        // --- ДВИЖЕНИЕ КОРПУСА ---
        if (input.isLeft()) this.hullAngle -= this.hullRotationSpeed * dt;
        if (input.isRight()) this.hullAngle += this.hullRotationSpeed * dt;

        let moveSpeed = 0;
        if (input.isForward()) moveSpeed = this.hullSpeed;
        if (input.isBackward()) moveSpeed = -this.hullSpeed * 0.6; // Назад едем медленнее

        if (moveSpeed !== 0) {
            let nextX = this.x + Math.cos(this.hullAngle) * moveSpeed * dt;
            let nextY = this.y + Math.sin(this.hullAngle) * moveSpeed * dt;

            // Проверка коллизий перед перемещением
            if (!arena.checkCollision(nextX, nextY, this.radius)) {
                this.x = nextX;
                this.y = nextY;
            } else if (!arena.checkCollision(nextX, this.y, this.radius)) {
                this.x = nextX; // Скольжение по оси X
            } else if (!arena.checkCollision(this.x, nextY, this.radius)) {
                this.y = nextY; // Скольжение по оси Y
            }
        }

        // --- ПОВОРОТ БАШНИ ---
        // Целевой угол (куда смотрит мышь)
        let targetTurretAngle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
        
        // Вычисляем разницу между текущим и целевым углом
        let angleDiff = targetTurretAngle - this.turretAngle;
        
        // Нормализуем угол, чтобы башня крутилась по кратчайшему пути (-PI до PI)
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

        // Плавно поворачиваем башню
        if (Math.abs(angleDiff) > 0.01) {
            let rotationStep = this.turretRotationSpeed * dt;
            if (Math.abs(angleDiff) < rotationStep) {
                this.turretAngle = targetTurretAngle; // Защелкиваем на цели
            } else {
                this.turretAngle += Math.sign(angleDiff) * rotationStep;
            }
        }
    }

    draw(ctx) {
        // Отрисовка КОРПУСА
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.hullAngle);
        
        // ЗАМЕНА НА КАРТИНКУ:
        // ctx.drawImage(imgHull, -width/2, -height/2, width, height);
        ctx.fillStyle = '#445522';
        ctx.fillRect(-25, -15, 50, 30); // Рисуем простой прямоугольник корпуса
        
        // Маркер переда корпуса
        ctx.fillStyle = '#223311';
        ctx.fillRect(15, -15, 10, 30); 
        ctx.restore();

        // Отрисовка БАШНИ
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        
        // ЗАМЕНА НА КАРТИНКУ:
        // ctx.drawImage(imgTurret, -width/2, -height/2, width, height);
        ctx.fillStyle = '#667733';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2); // Круглая башня
        ctx.fill();
        
        // Ствол
        ctx.fillStyle = '#111';
        ctx.fillRect(0, -3, 35, 6); 
        ctx.restore();
    }
}