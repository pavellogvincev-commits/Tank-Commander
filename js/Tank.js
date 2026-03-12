export class Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats, startingHp = null) {
        this.x = x; this.y = y; this.hullImg = hullImg; this.turretImg = turretImg;
        this.hullWidth = hullStats.size.w; this.hullHeight = hullStats.size.h;
        this.turretWidth = hullStats.size.w; this.turretHeight = hullStats.size.h;
        this.hitboxWidth = hullStats.hitbox.w; this.hitboxHeight = hullStats.hitbox.h; 
        this.radius = this.hitboxWidth / 2 + 2; 

        this.maxHp = hullStats.hp; 
        this.hp = startingHp !== null ? startingHp : this.maxHp;

        this.armor = { front: { current: hullStats.armor.front, max: hullStats.armor.front }, side: { current: hullStats.armor.side, max: hullStats.armor.side }, rear: { current: hullStats.armor.rear, max: hullStats.armor.rear } };

        this.speed = 0; 
        this.maxForwardSpeed = hullStats.speed; 
        this.maxReverseSpeed = -hullStats.speed / 2;  
        
        // ОБНОВЛЕНО: Ускорение зависит от максимальной скорости!
        this.acceleration = this.maxForwardSpeed * 3; 
        this.friction = this.maxForwardSpeed * 1.5; 
        this.brakePower = this.maxForwardSpeed * 4;       
        
        this.hullRotationSpeed = 1.5; this.hullAngle = 0; this.turretRotationSpeed = 2; this.turretAngle = 0;

        this.particles = []; this.particleTimer = 0;
        this.fireRate = turretStats.fireRate; this.penetration = turretStats.penetration; 
        this.burstCount = turretStats.burstCount || 1; this.burstDelay = turretStats.burstDelay || 0;    
        this.bulletRadius = turretStats.bulletRadius || 2.5; this.bulletColor = turretStats.bulletColor || '#ffaa00';
        this.shootSoundType = turretStats.shootSound || 'cannon';
        this.bulletSpeed = turretStats.bulletSpeed || 400; 

        this.fireCooldown = 0; this.burstsRemaining = 0; this.burstTimer = 0; this.shotsToFireThisFrame = 0; this.recoil = 0;         

        // ОБНОВЛЕНО: Новая система Дрона Леопарда
        this.hullName = hullStats.name;
        this.droneState = (this.hullName === "Леопард") ? 'ready' : 'none'; // 'ready', 'attacking', 'cooldown'
        this.droneAngle = 0;
        this.droneCooldown = 0;
        this.droneTarget = null;
        this.droneX = 0;
        this.droneY = 0;
        this.droneExplodeRequest = false; // Сигнал для main.js нарисовать взрыв
    }

    updateSmoke(dt) {
        this.particleTimer += dt;
        let smokeRate = Math.abs(this.speed) > 5 ? 0.05 : 0.2; 
        if (this.particleTimer > smokeRate) {
            this.particleTimer = 0;
            let exhaustX = this.x - Math.cos(this.hullAngle) * (this.hullWidth / 2.5); let exhaustY = this.y - Math.sin(this.hullAngle) * (this.hullWidth / 2.5);
            this.particles.push({ x: exhaustX + (Math.random() - 0.5) * 10, y: exhaustY + (Math.random() - 0.5) * 10, life: 1.0, maxLife: 1.0, size: 5 + Math.random() * 5 });
        }
        for (let i = this.particles.length - 1; i >= 0; i--) { let p = this.particles[i]; p.life -= dt; p.size += dt * 10; if (p.life <= 0) this.particles.splice(i, 1); }
    }

    updateWeapons(dt) {
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.recoil > 0) this.recoil -= dt * 10; if (this.recoil < 0) this.recoil = 0;
        this.shotsToFireThisFrame = 0;
        if (this.burstsRemaining > 0) {
            this.burstTimer -= dt;
            if (this.burstTimer <= 0) { this.shotsToFireThisFrame++; this.burstsRemaining--; this.burstTimer = this.burstDelay; this.recoil = 4; }
        }
    }

    tryShoot() {
        if (this.fireCooldown <= 0 && this.burstsRemaining === 0) { this.fireCooldown = this.fireRate; this.burstsRemaining = this.burstCount; this.burstTimer = 0; return true; }
        return false;
    }

    getShots() { return this.shotsToFireThisFrame; }

    update(dt, input, arena, enemies) {
        this.updateWeapons(dt); this.updateSmoke(dt); 

        // ОБНОВЛЕНО: ЛОГИКА АБИЛОК (ДРОН ЛЕОПАРДА)
        if (this.hullName === "Леопард") {
            if (this.droneState === 'cooldown') {
                this.droneCooldown -= dt;
                if (this.droneCooldown <= 0) this.droneState = 'ready';
            } else if (this.droneState === 'ready') {
                this.droneAngle += dt * 3; 
                if (enemies) {
                    for (let e of enemies) {
                        if (e.hp > 0 && (!e.stunTimer || e.stunTimer <= 0)) {
                            let dist = Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2));
                            if (dist < 180) { // Засекли цель
                                this.droneState = 'attacking';
                                this.droneTarget = e;
                                this.droneX = this.x + Math.cos(this.droneAngle) * 55;
                                this.droneY = this.y + Math.sin(this.droneAngle) * 55;
                                break;
                            }
                        }
                    }
                }
            } else if (this.droneState === 'attacking') {
                if (!this.droneTarget || this.droneTarget.hp <= 0) { // Если цель умерла пока летели
                    this.droneState = 'cooldown';
                    this.droneCooldown = 15.0;
                } else {
                    let dx = this.droneTarget.x - this.droneX;
                    let dy = this.droneTarget.y - this.droneY;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 15) { // Попадание!
                        this.droneTarget.stunTimer = 30.0;
                        this.droneTarget.isJustStunned = true;
                        this.droneState = 'cooldown';
                        this.droneCooldown = 15.0;
                        this.droneExplodeRequest = true; // Даем сигнал на взрыв
                    } else { // Летим к цели
                        let flightSpeed = 500 * dt; 
                        this.droneX += (dx / dist) * flightSpeed;
                        this.droneY += (dy / dist) * flightSpeed;
                    }
                }
            }
        }

        let isMoving = false;
        if (input.isUp()) { this.speed += this.acceleration * dt; isMoving = true; }
        else if (input.isDown()) { this.speed -= this.brakePower * dt; isMoving = true; }

        if (!isMoving) {
            if (this.speed > 0) { this.speed -= this.friction * dt; if (this.speed < 0) this.speed = 0; }
            else if (this.speed < 0) { this.speed += this.friction * dt; if (this.speed > 0) this.speed = 0; }
        }
        if (this.speed > this.maxForwardSpeed) this.speed = this.maxForwardSpeed;
        if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;

        if (input.isLeft()) this.hullAngle -= this.hullRotationSpeed * dt;
        if (input.isRight()) this.hullAngle += this.hullRotationSpeed * dt;

        let vx = Math.cos(this.hullAngle) * this.speed; let vy = Math.sin(this.hullAngle) * this.speed;
        let nextX = this.x + vx * dt; let nextY = this.y + vy * dt;

        let hitTanks = (checkX, checkY) => {
            if (!enemies) return false;
            for (let e of enemies) {
                if (e === this || e.hp <= 0) continue;
                let dist = Math.sqrt(Math.pow(checkX - e.x, 2) + Math.pow(checkY - e.y, 2));
                if (dist < this.radius + e.radius) return true;
            }
            return false;
        };

        let colX = arena.checkCollision(nextX, this.y, this.radius) || hitTanks(nextX, this.y);
        let colY = arena.checkCollision(this.x, nextY, this.radius) || hitTanks(this.x, nextY);

        if (!colX) this.x = nextX;
        if (!colY) this.y = nextY;

        let targetAngle = Math.atan2(input.getMouseY() - this.y, input.getMouseX() - this.x);
        let angleDiff = targetAngle - this.turretAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) > 0.05) this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;
    }

    checkHit(bullet) {
        if (this.hp <= 0) return { hit: false };
        let startX = bullet.prevX !== undefined ? bullet.prevX : bullet.x; let startY = bullet.prevY !== undefined ? bullet.prevY : bullet.y;
        let dxPath = bullet.x - startX; let dyPath = bullet.y - startY; let dist = Math.sqrt(dxPath*dxPath + dyPath*dyPath);
        let steps = Math.max(1, Math.ceil(dist / 2));

        for (let i = 1; i <= steps; i++) {
            let t = i / steps; let px = startX + dxPath * t; let py = startY + dyPath * t;
            let dx = px - this.x; let dy = py - this.y;
            let cos = Math.cos(-this.hullAngle); let sin = Math.sin(-this.hullAngle);
            let localX = dx * cos - dy * sin; let localY = dx * sin + dy * cos;
            let halfW = this.hitboxWidth / 2; let halfH = this.hitboxHeight / 2;

            if (localX > -halfW && localX < halfW && localY > -halfH && localY < halfH) {
                let distFront = Math.abs(halfW - localX); let distRear = Math.abs(-halfW - localX);  
                let distSide1 = Math.abs(halfH - localY); let distSide2 = Math.abs(-halfH - localY); 
                let minDist = Math.min(distFront, distRear, distSide1, distSide2);
                let hitZone = ''; let normalX = 0, normalY = 0;

                if (minDist === distFront) { hitZone = 'front'; normalX = 1; normalY = 0; }
                else if (minDist === distRear) { hitZone = 'rear'; normalX = -1; normalY = 0; }
                else { hitZone = 'side'; normalX = 0; normalY = minDist === distSide1 ? 1 : -1; }

                let localVx = bullet.vx * cos - bullet.vy * sin; let localVy = bullet.vx * sin + bullet.vy * cos;
                let speedSq = Math.sqrt(localVx*localVx + localVy*localVy);
                let dirX = localVx / speedSq; let dirY = localVy / speedSq;
                let dot = -(dirX * normalX + dirY * normalY);
                dot = Math.max(-1, Math.min(1, dot)); let angleDeg = Math.acos(dot) * (180 / Math.PI); 

                let cosHull = Math.cos(this.hullAngle); let sinHull = Math.sin(this.hullAngle);
                let worldNx = normalX * cosHull - normalY * sinHull; let worldNy = normalX * sinHull + normalY * cosHull;
                let hitResult = { hit: true, zone: hitZone, x: px, y: py, nx: worldNx, ny: worldNy };

                if (angleDeg > 90) angleDeg = 90; 
                let effectivePenetration = bullet.penetration * (1 - (angleDeg / 90));
                
                let currentArmor = this.armor[hitZone].current;
                this.armor[hitZone].current = Math.max(0, this.armor[hitZone].current - 1);

                if (effectivePenetration > currentArmor) {
                    let baseDamage = effectivePenetration - currentArmor;
                    let finalDamage = Math.floor(baseDamage + (Math.random() * (baseDamage * 0.1) * 2 - (baseDamage * 0.1)));
                    if (finalDamage < 1) finalDamage = 1; 

                    let isDestroyed = false; if (this.hp > 0 && this.hp - finalDamage <= 0) isDestroyed = true;
                    this.hp -= finalDamage; if (this.hp < 0) this.hp = 0;
                    hitResult.type = 'penetration'; hitResult.damage = finalDamage; hitResult.destroyed = isDestroyed;
                } else {
                    hitResult.type = 'ricochet'; hitResult.damage = 0;
                }
                return hitResult; 
            }
        }
        return { hit: false };
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        for (let p of this.particles) { 
            ctx.fillStyle = `rgba(100, 100, 100, ${p.life / p.maxLife * 0.5})`; 
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); 
        }

        ctx.save(); ctx.translate(this.x + 5, this.y + 5); ctx.rotate(this.hullAngle); ctx.filter = 'brightness(0) opacity(0.4)'; ctx.drawImage(this.hullImg, -this.hullWidth / 2, -this.hullHeight / 2, this.hullWidth, this.hullHeight); ctx.restore();
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.hullAngle); ctx.drawImage(this.hullImg, -this.hullWidth / 2, -this.hullHeight / 2, this.hullWidth, this.hullHeight); ctx.restore();
        
        ctx.save(); ctx.translate(this.x + 8, this.y + 8); ctx.rotate(this.turretAngle); ctx.filter = 'brightness(0) opacity(0.4)'; ctx.drawImage(this.turretImg, -this.turretWidth / 2 - this.recoil, -this.turretHeight / 2, this.turretWidth, this.turretHeight); ctx.restore();
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.turretAngle); ctx.drawImage(this.turretImg, -this.turretWidth / 2 - this.recoil, -this.turretHeight / 2, this.turretWidth, this.turretHeight); ctx.restore();

        let barWidth = 40; let hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = 'red'; ctx.fillRect(this.x - barWidth / 2, this.y - this.hullHeight / 2 - 20, barWidth, 4);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - barWidth / 2, this.y - this.hullHeight / 2 - 20, barWidth * hpPercent, 4);
    }
}
