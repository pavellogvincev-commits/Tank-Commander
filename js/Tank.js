export class Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        this.x = x;
        this.y = y;
        
        this.hullImg = hullImg;
        this.turretImg = turretImg;
        
        // --- ДИНАМИЧЕСКИЕ РАЗМЕРЫ ИЗ БАЗЫ ДАННЫХ ---
        this.hullWidth = hullStats.size.w;
        this.hullHeight = hullStats.size.h;
        this.turretWidth = hullStats.size.w; // Башня масштабируется вместе с корпусом
        this.turretHeight = hullStats.size.h;

        this.hitboxWidth = hullStats.hitbox.w;  
        this.hitboxHeight = hullStats.hitbox.h; 
        this.radius = this.hitboxWidth / 2 + 2; // Динамический радиус столкновений со стенами

        this.maxHp = hullStats.hp;
        this.hp = hullStats.hp;
        
        this.armor = {
            front: { current: hullStats.armor.front, max: hullStats.armor.front },
            side:  { current: hullStats.armor.side, max: hullStats.armor.side },
            rear:  { current: hullStats.armor.rear, max: hullStats.armor.rear }
        };

        this.maxForwardSpeed = hullStats.speed;  
        this.maxReverseSpeed = -hullStats.speed / 2;  
        this.acceleration = 80;     
        this.friction = 100;         
        this.brakePower = 160;       

        this.hullRotationSpeed = 1;
        this.hullAngle = 0;
        this.turretRotationSpeed = 1;
        this.turretAngle = 0;

        // --- ЛОГИКА СТРЕЛЬБЫ И ОЧЕРЕДЕЙ (BURST) ---
        this.fireRate = turretStats.fireRate;    
        this.penetration = turretStats.penetration; 
        this.burstCount = turretStats.burstCount || 1;    // Сколько пуль в очереди
        this.burstDelay = turretStats.burstDelay || 0;    // Задержка между пулями в очереди

        this.fireCooldown = 0;   
        this.burstsRemaining = 0; 
        this.burstTimer = 0;
        this.shotsToFireThisFrame = 0; // Сколько пуль должно вылететь в этом кадре
        this.recoil = 0;         
    }

    // Обновление таймеров оружия
    updateWeapons(dt) {
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.recoil > 0) this.recoil -= dt * 10;
        if (this.recoil < 0) this.recoil = 0;

        this.shotsToFireThisFrame = 0;

        // Если танк в процессе выпуска очереди
        if (this.burstsRemaining > 0) {
            this.burstTimer -= dt;
            if (this.burstTimer <= 0) {
                this.shotsToFireThisFrame++;
                this.burstsRemaining--;
                this.burstTimer = this.burstDelay; // Таймер до следующей пули в очереди
                this.recoil = 4; // Визуальная отдача
            }
        }
    }

    tryShoot() {
        // Начать стрелять можно, только если остыла пушка И мы сейчас не выпускаем очередь
        if (this.fireCooldown <= 0 && this.burstsRemaining === 0) {
            this.fireCooldown = this.fireRate;
            this.burstsRemaining = this.burstCount;
            this.burstTimer = 0; // Первая пуля вылетит мгновенно
            return true;
        }
        return false;
    }

    // Возвращает количество пуль, которые физически вылетают в данный момент
    getShots() {
        return this.shotsToFireThisFrame;
    }

    update(dt, input, arena) {
        this.updateWeapons(dt);

        let moveDir = 0;
        if (input.isUp()) moveDir = 1;
        if (input.isDown()) moveDir = -1;

        if (input.isLeft()) this.hullAngle -= this.hullRotationSpeed * dt;
        if (input.isRight()) this.hullAngle += this.hullRotationSpeed * dt;

        let currentSpeed = moveDir === 1 ? this.maxForwardSpeed : (moveDir === -1 ? this.maxReverseSpeed : 0);
        
        let vx = Math.cos(this.hullAngle) * currentSpeed;
        let vy = Math.sin(this.hullAngle) * currentSpeed;

        let nextX = this.x + vx * dt;
        let nextY = this.y + vy * dt;

        if (!arena.checkCollision(nextX, this.y, this.radius)) this.x = nextX;
        if (!arena.checkCollision(this.x, nextY, this.radius)) this.y = nextY;

        let targetAngle = Math.atan2(input.getMouseY() - this.y, input.getMouseX() - this.x);
        
        let angleDiff = targetAngle - this.turretAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) > 0.05) {
            this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;
        }
    }

    checkHit(bullet) {
        if (this.hp <= 0) return { hit: false };

        let dx = bullet.x - this.x;
        let dy = bullet.y - this.y;
        
        let cos = Math.cos(-this.hullAngle);
        let sin = Math.sin(-this.hullAngle);
        let localX = dx * cos - dy * sin;
        let localY = dx * sin + dy * cos;

        // ИСПОЛЬЗУЕМ ХИТБОКС (hitboxWidth), А НЕ РАЗМЕР КАРТИНКИ
        let halfW = this.hitboxWidth / 2;
        let halfH = this.hitboxHeight / 2;

        if (localX > -halfW && localX < halfW && localY > -halfH && localY < halfH) {
            let distFront = Math.abs(halfW - localX);  
            let distRear = Math.abs(-halfW - localX);  
            let distSide1 = Math.abs(halfH - localY);  
            let distSide2 = Math.abs(-halfH - localY); 

            let minDist = Math.min(distFront, distRear, distSide1, distSide2);
            let hitZone = '';
            let normalX = 0, normalY = 0;

            if (minDist === distFront) { hitZone = 'front'; normalX = 1; normalY = 0; }
            else if (minDist === distRear) { hitZone = 'rear'; normalX = -1; normalY = 0; }
            else { hitZone = 'side'; normalX = 0; normalY = minDist === distSide1 ? 1 : -1; }

            let localVx = bullet.vx * cos - bullet.vy * sin;
            let localVy = bullet.vx * sin + bullet.vy * cos;
            let speed = Math.sqrt(localVx*localVx + localVy*localVy);
            let dirX = localVx / speed;
            let dirY = localVy / speed;

            let dot = -(dirX * normalX + dirY * normalY);
            dot = Math.max(-1, Math.min(1, dot));
            let angleDeg = Math.acos(dot) * (180 / Math.PI); 

            let cosHull = Math.cos(this.hullAngle);
            let sinHull = Math.sin(this.hullAngle);
            let worldNx = normalX * cosHull - normalY * sinHull;
            let worldNy = normalX * sinHull + normalY * cosHull;

            let hitResult = { hit: true, zone: hitZone, x: bullet.x, y: bullet.y, nx: worldNx, ny: worldNy };

            if (angleDeg > 90) angleDeg = 90; 
            let effectivePenetration = bullet.penetration * (1 - (angleDeg / 90));
            let currentArmor = this.armor[hitZone].current;

            if (effectivePenetration > currentArmor) {
                let baseDamage = effectivePenetration - currentArmor;
                let variation = baseDamage * 0.1;
                let finalDamage = Math.floor(baseDamage + (Math.random() * variation * 2 - variation));
                if (finalDamage < 1) finalDamage = 1; 

                let isDestroyed = false;
                if (this.hp > 0 && this.hp - finalDamage <= 0) isDestroyed = true;

                this.hp -= finalDamage;
                if (this.hp < 0) this.hp = 0;
                
                hitResult.type = 'penetration'; hitResult.damage = finalDamage; hitResult.destroyed = isDestroyed;
            } else {
                let armorDamage = Math.floor(bullet.penetration * 0.1); 
                this.armor[hitZone].current = Math.max(0, this.armor[hitZone].current - armorDamage);
                hitResult.type = 'ricochet'; hitResult.damage = 0;
            }
            return hitResult; 
        }
        return { hit: false };
    }

    draw(ctx) {
        if (this.hp <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.hullAngle);
        ctx.drawImage(this.hullImg, -this.hullWidth / 2, -this.hullHeight / 2, this.hullWidth, this.hullHeight);
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        ctx.drawImage(this.turretImg, -this.turretWidth / 2 - this.recoil, -this.turretHeight / 2, this.turretWidth, this.turretHeight);
        ctx.restore();
    }
}
