export class Tank {
    constructor(x, y, hullImg, turretImg) {
        this.x = x;
        this.y = y;
        this.radius = 20;

        this.hullImg = hullImg;
        this.turretImg = turretImg;

        // ТВОИ РАЗМЕРЫ
        this.hullWidth = 60;
        this.hullHeight = 45;
        this.turretWidth = 60;
        this.turretHeight = 45;

        // ТВОЯ ФИЗИКА
        this.currentSpeed = 0;       
        this.maxForwardSpeed = 50;  
        this.maxReverseSpeed = -25;  
        this.acceleration = 80;     
        this.friction = 100;         
        this.brakePower = 160;       

        this.hullRotationSpeed = 1;
        this.hullAngle = 0;

        this.turretRotationSpeed = 1;
        this.turretAngle = 0;

        this.particles = [];
        this.particleTimer = 0;

        // --- НОВОЕ: ОРУЖИЕ ---
        this.fireRate = 1.0;     // Время перезарядки (1 секунда между выстрелами)
        this.fireCooldown = 0;   // Текущий таймер перезарядки
        this.recoil = 0;         // Смещение башни при отдаче
    }

    update(dt, input, arena) {
        // --- ДВИЖЕНИЕ ---
        if (input.isLeft()) this.hullAngle -= this.hullRotationSpeed * dt;
        if (input.isRight()) this.hullAngle += this.hullRotationSpeed * dt;

        let isEngineRunning = false;

        if (input.isForward()) {
            isEngineRunning = true;
            if (this.currentSpeed < 0) this.currentSpeed += this.brakePower * dt;
            else this.currentSpeed += this.acceleration * dt;
        } 
        else if (input.isBackward()) {
            isEngineRunning = true;
            if (this.currentSpeed > 0) this.currentSpeed -= this.brakePower * dt;
            else this.currentSpeed -= this.acceleration * dt;
        } 
        else {
            if (this.currentSpeed > 0) {
                this.currentSpeed -= this.friction * dt;
                if (this.currentSpeed < 0) this.currentSpeed = 0; 
            } else if (this.currentSpeed < 0) {
                this.currentSpeed += this.friction * dt;
                if (this.currentSpeed > 0) this.currentSpeed = 0;
            }
        }

        if (this.currentSpeed > this.maxForwardSpeed) this.currentSpeed = this.maxForwardSpeed;
        if (this.currentSpeed < this.maxReverseSpeed) this.currentSpeed = this.maxReverseSpeed;

        if (Math.abs(this.currentSpeed) > 0.1) {
            let nextX = this.x + Math.cos(this.hullAngle) * this.currentSpeed * dt;
            let nextY = this.y + Math.sin(this.hullAngle) * this.currentSpeed * dt;

            if (!arena.checkCollision(nextX, nextY, this.radius)) {
                this.x = nextX; this.y = nextY;
            } else if (!arena.checkCollision(nextX, this.y, this.radius)) {
                this.x = nextX; this.currentSpeed *= 0.9; 
            } else if (!arena.checkCollision(this.x, nextY, this.radius)) {
                this.y = nextY; this.currentSpeed *= 0.9;
            } else {
                this.currentSpeed = 0; 
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

        // --- НОВОЕ: ТАЙМЕРЫ ОРУЖИЯ ---
        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt; // Уменьшаем таймер перезарядки
        }
        
        // Возврат башни на место после выстрела (пружинный эффект)
        if (this.recoil > 0) {
            this.recoil -= 30 * dt; 
            if (this.recoil < 0) this.recoil = 0;
        }

        this.updateSmoke(dt, isEngineRunning);
    }

    // --- НОВОЕ: МЕТОД ПОПЫТКИ ВЫСТРЕЛА ---
    tryShoot() {
        if (this.fireCooldown <= 0) {
            this.fireCooldown = this.fireRate; // Сбрасываем кулдаун
            this.recoil = 8;                   // Башня дергается на 8 пикселей назад
            return true;                       // Разрешаем выстрел
        }
        return false; // Идет перезарядка
    }

    updateSmoke(dt, isEngineRunning) {
        this.particleTimer += dt;
        let spawnRate = isEngineRunning ? 0.05 : 0.2; 

        if (this.particleTimer > spawnRate) {
            this.particleTimer = 0;
            let rearOffset = this.hullWidth / 2 - 5; 
            let rearX = this.x - Math.cos(this.hullAngle) * rearOffset;
            let rearY = this.y - Math.sin(this.hullAngle) * rearOffset;

            this.particles.push({
                x: rearX + (Math.random() - 0.5) * 10, 
                y: rearY + (Math.random() - 0.5) * 10,
                life: 1.0, maxLife: 1.0,
                size: 3 + Math.random() * 4,
                vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
            else {
                p.x += p.vx * dt; p.y += p.vy * dt;
                p.size += 15 * dt; 
            }
        }
    }

    draw(ctx) {
        for (let p of this.particles) {
            let alpha = (p.life / p.maxLife) * 0.5; 
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`; 
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.hullAngle);
        ctx.drawImage(this.hullImg, -this.hullWidth / 2, -this.hullHeight / 2, this.hullWidth, this.hullHeight);
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        // НОВОЕ: вычитаем this.recoil по оси X, чтобы башня сдвигалась назад при выстреле
        ctx.drawImage(this.turretImg, -this.turretWidth / 2 - this.recoil, -this.turretHeight / 2, this.turretWidth, this.turretHeight);
        ctx.restore();
    }
}
