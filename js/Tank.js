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

        // Здоровье
        this.maxHp = 200;
        this.hp = 200;
        
        // Броня
        this.armor = {
            front: { current: 80, max: 80 },
            side:  { current: 40, max: 40 },
            rear:  { current: 25, max: 25 }
        };

        // Твоя физика
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

        // Оружие
        this.fireRate = 1.0;    
        this.fireCooldown = 0;   
        this.recoil = 0;         
    }

    update(dt, input, arena) {
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

        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.recoil > 0) {
            this.recoil -= 30 * dt; 
            if (this.recoil < 0) this.recoil = 0;
        }

        this.updateSmoke(dt, isEngineRunning);
    }

    tryShoot() {
        if (this.fireCooldown <= 0) {
            this.fireCooldown = this.fireRate; 
            this.recoil = 4; // Отдача 4 пкс                   
            return true;                       
        }
        return false; 
    }

        checkHit(bullet) {
        if (this.hp <= 0) return { hit: false };

        let dx = bullet.x - this.x;
        let dy = bullet.y - this.y;
        
        let cos = Math.cos(-this.hullAngle);
        let sin = Math.sin(-this.hullAngle);
        let localX = dx * cos - dy * sin;
        let localY = dx * sin + dy * cos;

        let halfW = this.hullWidth / 2;
        let halfH = this.hullHeight / 2;

        if (localX > -halfW && localX < halfW && localY > -halfH && localY < halfH) {
            let distFront = Math.abs(halfW - localX);  
            let distRear = Math.abs(-halfW - localX);  
            let distSide1 = Math.abs(halfH - localY);  
            let distSide2 = Math.abs(-halfH - localY); 

            let minDist = Math.min(distFront, distRear, distSide1, distSide2);
            let hitZone = '';
            // Локальные нормали (относительно танка)
            let normalX = 0, normalY = 0;

            if (minDist === distFront) { hitZone = 'front'; normalX = 1; normalY = 0; }
            else if (minDist === distRear) { hitZone = 'rear'; normalX = -1; normalY = 0; }
            else { hitZone = 'side'; normalX = 0; normalY = minDist === distSide1 ? 1 : -1; }

            // Вычисляем угол попадания
            let localVx = bullet.vx * cos - bullet.vy * sin;
            let localVy = bullet.vx * sin + bullet.vy * cos;
            let speed = Math.sqrt(localVx*localVx + localVy*localVy);
            let dirX = localVx / speed;
            let dirY = localVy / speed;

            let dot = -(dirX * normalX + dirY * normalY);
            dot = Math.max(-1, Math.min(1, dot));
            let angleDeg = Math.acos(dot) * (180 / Math.PI); 

            // --- НОВОЕ: Переводим локальную нормаль брони обратно в глобальные координаты ---
            // Это нужно пуле, чтобы правильно отскочить!
            let cosHull = Math.cos(this.hullAngle);
            let sinHull = Math.sin(this.hullAngle);
            let worldNx = normalX * cosHull - normalY * sinHull;
            let worldNy = normalX * sinHull + normalY * cosHull;

            let hitResult = { 
                hit: true, 
                zone: hitZone, 
                x: bullet.x, 
                y: bullet.y,
                nx: worldNx, // Передаем нормаль пуле
                ny: worldNy
            };

            if (angleDeg > 90) angleDeg = 90; 
            let effectivePenetration = bullet.penetration * (1 - (angleDeg / 90));
            let currentArmor = this.armor[hitZone].current;

            if (effectivePenetration > currentArmor) {
                let baseDamage = effectivePenetration - currentArmor;
                let variation = baseDamage * 0.1;
                let finalDamage = Math.floor(baseDamage + (Math.random() * variation * 2 - variation));
                if (finalDamage < 1) finalDamage = 1; 

                this.hp -= finalDamage;
                if (this.hp < 0) this.hp = 0;
                
                hitResult.type = 'penetration';
                hitResult.damage = finalDamage;
            } else {
                let armorDamage = Math.floor(bullet.penetration * 0.1); 
                this.armor[hitZone].current = Math.max(0, this.armor[hitZone].current - armorDamage);
                
                hitResult.type = 'ricochet';
                hitResult.damage = 0;
            }

            return hitResult; 
        }
        return { hit: false };
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
                life: 1.0, maxLife: 1.0, size: 3 + Math.random() * 4,
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
        // Отрисовка дыма
        for (let p of this.particles) {
            let alpha = (p.life / p.maxLife) * 0.5; 
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`; 
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Отрисовка корпуса
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.hullAngle);
        ctx.drawImage(this.hullImg, -this.hullWidth / 2, -this.hullHeight / 2, this.hullWidth, this.hullHeight);
        ctx.restore();

        // Отрисовка башни
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        ctx.drawImage(this.turretImg, -this.turretWidth / 2 - this.recoil, -this.turretHeight / 2, this.turretWidth, this.turretHeight);
        ctx.restore();

        // Отрисовка полоски здоровья (HP Bar)
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 25, this.y - 40, 50, 5);
        ctx.fillStyle = '#00ff00';
        // Math.max защищает от отрисовки в минус
        let hpWidth = 50 * (Math.max(0, this.hp) / this.maxHp);
        ctx.fillRect(this.x - 25, this.y - 40, hpWidth, 5);
    }
}

