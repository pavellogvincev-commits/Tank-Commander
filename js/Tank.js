export class Tank {
    constructor(x, y, hullImg, turretImg) {
        this.x = x;
        this.y = y;
        this.radius = 20;

        this.hullImg = hullImg;
        this.turretImg = turretImg;

        this.hullWidth = 60;
        this.hullHeight = 45;
        this.turretWidth = 60;
        this.turretHeight = 45;

        // --- НОВАЯ ФИЗИКА КОРПУСА ---
        this.currentSpeed = 0;       // Текущая скорость
        this.maxForwardSpeed = 150;  // Макс. скорость вперед
        this.maxReverseSpeed = -75;  // Макс. скорость назад (в 2 раза меньше)
        
        this.acceleration = 200;     // Набор скорости (пикселей в сек за сек)
        this.friction = 100;         // Трение (как быстро останавливается сам)
        this.brakePower = 400;       // Сила торможения (когда жмешь в противоположную сторону)

        this.hullRotationSpeed = 1;
        this.hullAngle = 0;

        // Характеристики Башни
        this.turretRotationSpeed = 2;
        this.turretAngle = 0;

        // --- СИСТЕМА ЧАСТИЦ (ДЫМ) ---
        this.particles = [];
        this.particleTimer = 0;
    }

    update(dt, input, arena) {
        // --- ПОВОРОТ КОРПУСА ---
        if (input.isLeft()) this.hullAngle -= this.hullRotationSpeed * dt;
        if (input.isRight()) this.hullAngle += this.hullRotationSpeed * dt;

        // --- ФИЗИКА ДВИЖЕНИЯ (Ускорение и Торможение) ---
        let isEngineRunning = false; // Флажок, чтобы знать, газует ли игрок

        if (input.isForward()) {
            isEngineRunning = true;
            if (this.currentSpeed < 0) {
                // Если ехали назад, а жмем вперед -> Резко тормозим
                this.currentSpeed += this.brakePower * dt;
            } else {
                // Плавно разгоняемся вперед
                this.currentSpeed += this.acceleration * dt;
            }
        } 
        else if (input.isBackward()) {
            isEngineRunning = true;
            if (this.currentSpeed > 0) {
                // Если ехали вперед, а жмем назад -> Резко тормозим
                this.currentSpeed -= this.brakePower * dt;
            } else {
                // Плавно разгоняемся назад
                this.currentSpeed -= this.acceleration * dt;
            }
        } 
        else {
            // Если ничего не нажато -> Трение (плавная остановка)
            if (this.currentSpeed > 0) {
                this.currentSpeed -= this.friction * dt;
                if (this.currentSpeed < 0) this.currentSpeed = 0; // Чтобы не покатился назад
            } else if (this.currentSpeed < 0) {
                this.currentSpeed += this.friction * dt;
                if (this.currentSpeed > 0) this.currentSpeed = 0;
            }
        }

        // Ограничитель максимальной скорости
        if (this.currentSpeed > this.maxForwardSpeed) this.currentSpeed = this.maxForwardSpeed;
        if (this.currentSpeed < this.maxReverseSpeed) this.currentSpeed = this.maxReverseSpeed;

        // --- ПРИМЕНЕНИЕ СКОРОСТИ И КОЛЛИЗИИ ---
        if (Math.abs(this.currentSpeed) > 0.1) {
            let nextX = this.x + Math.cos(this.hullAngle) * this.currentSpeed * dt;
            let nextY = this.y + Math.sin(this.hullAngle) * this.currentSpeed * dt;

            if (!arena.checkCollision(nextX, nextY, this.radius)) {
                this.x = nextX;
                this.y = nextY;
            } else if (!arena.checkCollision(nextX, this.y, this.radius)) {
                this.x = nextX;
                this.currentSpeed *= 0.9; // Слегка теряем скорость при трении о стену боком
            } else if (!arena.checkCollision(this.x, nextY, this.radius)) {
                this.y = nextY;
                this.currentSpeed *= 0.9;
            } else {
                this.currentSpeed = 0; // Полная остановка при лобовом столкновении
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

        // --- ОБНОВЛЕНИЕ ДЫМА ---
        this.updateSmoke(dt, isEngineRunning);
    }

    updateSmoke(dt, isEngineRunning) {
        this.particleTimer += dt;
        
        // Если газуем - дым идет чаще, если стоим - редко
        let spawnRate = isEngineRunning ? 0.05 : 0.2; 

        if (this.particleTimer > spawnRate) {
            this.particleTimer = 0;

            // Вычисляем координаты выхлопной трубы (задняя часть танка)
            // Используем синус и косинус, чтобы дым всегда был сзади, как бы танк ни повернулся
            let rearOffset = this.hullWidth / 2 - 5; 
            let rearX = this.x - Math.cos(this.hullAngle) * rearOffset;
            let rearY = this.y - Math.sin(this.hullAngle) * rearOffset;

            // Создаем новую частицу дыма
            this.particles.push({
                x: rearX + (Math.random() - 0.5) * 10, // Легкий разброс координат
                y: rearY + (Math.random() - 0.5) * 10,
                life: 1.0,      // Частица живет 1 секунду
                maxLife: 1.0,
                size: 3 + Math.random() * 4, // Начальный размер
                // Медленный случайный дрейф дыма в стороны
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15
            });
        }

        // Обновляем существующие частицы
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life -= dt;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1); // Удаляем мертвые частицы
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.size += 15 * dt; // Дым расширяется со временем
            }
        }
    }

    draw(ctx) {
        // --- ОТРИСОВКА ДЫМА ---
        // Рисуем дым ДО танка, чтобы он стелился по земле и танк его не перекрывал
        for (let p of this.particles) {
            // Высчитываем прозрачность: чем меньше жизни осталось, тем прозрачнее
            let alpha = (p.life / p.maxLife) * 0.5; 
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`; // Серый цвет с альфа-каналом
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Отрисовка КОРПУСА
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.hullAngle);
        ctx.drawImage(this.hullImg, -this.hullWidth / 2, -this.hullHeight / 2, this.hullWidth, this.hullHeight);
        ctx.restore();

        // Отрисовка БАШНИ
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        ctx.drawImage(this.turretImg, -this.turretWidth / 2 + 5, -this.turretHeight / 2, this.turretWidth, this.turretHeight);
        ctx.restore();
    }
}
