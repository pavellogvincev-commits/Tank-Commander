export class Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats, startingHp = null, hullId = null, hullStatLevels = null) {
        this.x = x; this.y = y; this.hullImg = hullImg; this.turretImg = turretImg;
        this.hullWidth = hullStats.size.w; this.hullHeight = hullStats.size.h;
        this.turretWidth = hullStats.size.w; this.turretHeight = hullStats.size.h;
        this.hitboxWidth = hullStats.hitbox.w; this.hitboxHeight = hullStats.hitbox.h; 
        this.radius = this.hitboxWidth / 2 + 2; 

        this.maxHp = hullStats.hp; this.hp = startingHp !== null ? startingHp : this.maxHp;
        this.armor = { front: { current: hullStats.armor.front, max: hullStats.armor.front }, side: { current: hullStats.armor.side, max: hullStats.armor.side }, rear: { current: hullStats.armor.rear, max: hullStats.armor.rear } };

        this.speed = 0; this.maxForwardSpeed = hullStats.speed; this.maxReverseSpeed = -hullStats.speed / 2;  
        this.acceleration = this.maxForwardSpeed * 3; this.friction = this.maxForwardSpeed * 1.5; this.brakePower = this.maxForwardSpeed * 4;       
        this.hullRotationSpeed = 1.5; this.hullAngle = 0; this.turretRotationSpeed = 2; this.turretAngle = 0;
        
        this.pushVx = 0; this.pushVy = 0; this.isExploded = false;
        this.particles = []; this.particleTimer = 0;
        
        this.turretName = turretStats.name; this.gatlingSpinTimer = 0; 
        this.fireRate = turretStats.fireRate; this.penetration = turretStats.penetration || 0; 
        this.bulletRadius = turretStats.bulletRadius || 2.5; this.bulletColor = turretStats.bulletColor || '#ffaa00';
        this.shootSoundType = turretStats.shootSound || 'cannon'; this.bulletSpeed = turretStats.bulletSpeed || 400; 
        this.spread = turretStats.spread || 0;
        
        this.artilleryDamage = turretStats.damage || 0;
        this.artilleryRadius = turretStats.explosionRadius || 0;

        this.isMagazineWeapon = turretStats.magazineSize !== undefined;
        this.maxAmmo = this.isMagazineWeapon ? turretStats.magazineSize : 0;
        this.ammo = this.maxAmmo; this.reloadTime = turretStats.reloadTime || 0; this.isReloading = false;
        this.burstCount = turretStats.burstCount || 1; this.burstDelay = turretStats.burstDelay || 0;    
        this.fireCooldown = this.fireRate; this.burstsRemaining = 0; this.burstTimer = 0; this.shotsToFireThisFrame = 0; this.recoil = 0;         

        this.shieldTimer = 0; this.hullName = hullStats.name;
        
        this.droneState = (this.hullName === "Леопард") ? 'ready' : 'none';
        this.droneAngle = 0; this.droneCooldown = 0; this.droneTarget = null; this.droneX = 0; this.droneY = 0; this.droneExplodeRequest = false;
        this.droneStunTime = 7 + (hullStatLevels ? (hullStatLevels.stunDuration || 0) : 0);

        this.mineTimer = 0; this.mineRequest = false;
        this.maxMines = 6;
        this.minesPlaced = 0;
        this.mineBonusDamage = hullStatLevels ? (hullStatLevels.mineDamage || 0) : 0;
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
        if (this.gatlingSpinTimer > 0) this.gatlingSpinTimer -= dt;

        this.shotsToFireThisFrame = 0;

        if (this.isMagazineWeapon) {
            if (this.isReloading && this.fireCooldown <= 0) { this.isReloading = false; this.ammo = this.maxAmmo; }
        } else {
            if (this.burstsRemaining > 0) {
                this.burstTimer -= dt;
                if (this.burstTimer <= 0) { this.shotsToFireThisFrame++; this.burstsRemaining--; this.burstTimer = this.burstDelay; this.recoil = 4; }
            }
        }
    }

    tryShoot() {
        if (this.isMagazineWeapon) {
            if (!this.isReloading && this.fireCooldown <= 0 && this.ammo > 0) {
                this.gatlingSpinTimer = 0.1; this.shotsToFireThisFrame = 1; this.ammo--; this.fireCooldown = this.fireRate; this.recoil = 2; 
                if (this.ammo <= 0) { this.isReloading = true; this.fireCooldown = this.reloadTime; }
                return true;
            }
        } else {
            if (this.fireCooldown <= 0 && this.burstsRemaining === 0) { this.fireCooldown = this.fireRate; this.burstsRemaining = this.burstCount; this.burstTimer = 0; return true; }
        }
        return false;
    }

    getShots() { return this.shotsToFireThisFrame; }

    update(dt, input, arena, enemies) {
        if (this.shieldTimer > 0) this.shieldTimer -= dt;
        this.updateWeapons(dt); this.updateSmoke(dt); 

        if (this.hullName === "Леопард") {
            if (this.droneState === 'cooldown') {
                this.droneCooldown -= dt; if (this.droneCooldown <= 0) this.droneState = 'ready';
            } else if (this.droneState === 'ready') {
                this.droneAngle += dt * 3; 
                if (enemies) {
                    for (let e of enemies) {
                        if (e.hp > 0 && (!e.stunTimer || e.stunTimer <= 0)) {
                            let dist = Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2));
                            if (dist < 180 && e !== this) { this.droneState = 'attacking'; this.droneTarget = e; this.droneX = this.x + Math.cos(this.droneAngle) * 55; this.droneY = this.y + Math.sin(this.droneAngle) * 55; break; }
                        }
                    }
                }
            } else if (this.droneState === 'attacking') {
                if (!this.droneTarget || this.droneTarget.hp <= 0) { this.droneState = 'cooldown'; this.droneCooldown = 12.0; } 
                else {
                    let dx = this.droneTarget.x - this.droneX; let dy = this.droneTarget.y - this.droneY; let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 15) { this.droneTarget.stunTimer = this.droneStunTime; this.droneTarget.isJustStunned = true; this.droneState = 'cooldown'; this.droneCooldown = 12.0; this.droneExplodeRequest = true; } 
                    else { let flightSpeed = 500 * dt; this.droneX += (dx / dist) * flightSpeed; this.droneY += (dy / dist) * flightSpeed; }
                }
            }
        }
        
        if (this.hullName === "Титан" && this.minesPlaced < this.maxMines) { 
            this.mineTimer += dt; 
            if (this.mineTimer >= 4.0) { this.mineTimer = 0; this.mineRequest = true; this.minesPlaced++; } 
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
        
        let damp = Math.pow(0.001, dt); 
        this.pushVx *= damp; this.pushVy *= damp;
        if (Math.abs(this.pushVx) < 5) this.pushVx = 0;
        if (Math.abs(this.pushVy) < 5) this.pushVy = 0;

        let isPushingBarrel = false;
        if (arena.barrels) {
            for (let b of arena.barrels) {
                let dx = b.x - this.x; let dy = b.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                let minDist = this.radius + b.radius;
                if (dist < minDist && dist > 0) {
                    isPushingBarrel = true;
                    let overlap = minDist - dist;
                    let nx = dx / dist; let ny = dy / dist;
                    let bNextX = b.x + nx * overlap; let bNextY = b.y + ny * overlap;
                    if (!arena.checkCollision(bNextX, b.y, b.radius)) b.x = bNextX; else this.x -= nx * overlap;
                    if (!arena.checkCollision(b.x, bNextY, b.radius)) b.y = bNextY; else this.y -= ny * overlap;
                }
            }
        }

        let actualSpeed = isPushingBarrel ? this.speed * 0.9 : this.speed;
        let vx = Math.cos(this.hullAngle) * actualSpeed + this.pushVx; 
        let vy = Math.sin(this.hullAngle) * actualSpeed + this.pushVy;
        let nextX = this.x + vx * dt; let nextY = this.y + vy * dt;
        
        let colX = arena.checkCollision(nextX, this.y, this.radius);
        let colY = arena.checkCollision(this.x, nextY, this.radius);

        if (!colX) this.x = nextX; else this.pushVx *= -0.4; 
        if (!colY) this.y = nextY; else this.pushVy *= -0.4;

        if (enemies) {
            for (let e of enemies) {
                if (e === this || e.hp <= 0) continue;
                let dx = this.x - e.x; let dy = this.y - e.y; let dist = Math.sqrt(dx*dx + dy*dy); let minDist = this.radius + e.radius;
                if (dist < minDist && dist > 0) {
                    let overlap = minDist - dist; let nx = dx / dist; let ny = dy / dist;
                    let pushForce = overlap * 0.5; let nextPushX = this.x + nx * pushForce; let nextPushY = this.y + ny * pushForce;
                    if (!arena.checkCollision(nextPushX, this.y, this.radius)) this.x = nextPushX;
                    if (!arena.checkCollision(this.x, nextPushY, this.radius)) this.y = nextPushY;
                }
            }
        }

        let targetAngle = Math.atan2(input.getMouseY() - this.y, input.getMouseX() - this.x);
        let angleDiff = targetAngle - this.turretAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) > 0.05) this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;
    }

    applyExplosionDamage(ex, ey, maxDamage, maxRadius) {
        if (this.hp <= 0) return { hit: false };
        
        let distToCenter = Math.sqrt(Math.pow(ex - this.x, 2) + Math.pow(ey - this.y, 2));
        let distToEdge = distToCenter - this.radius;
        if (distToEdge < 0) distToEdge = 0; 

        if (distToEdge > maxRadius) return { hit: false };
        if (this.shieldTimer > 0) return { hit: true, damage: 0, destroyed: false }; 

        let ratio = distToEdge / maxRadius;
        let damageMultiplier = 0;

        if (ratio <= 0.5) {
            damageMultiplier = 1.0 - (ratio / 0.5) * 0.1;
        } else {
            let outerRatio = (ratio - 0.5) / 0.5; 
            damageMultiplier = 0.9 * (1.0 - outerRatio);
        }

        let baseDamage = maxDamage * damageMultiplier;

        let angleToExplosion = Math.atan2(ey - this.y, ex - this.x);
        let relAngle = angleToExplosion - this.hullAngle;
        while (relAngle > Math.PI) relAngle -= Math.PI * 2;
        while (relAngle < -Math.PI) relAngle += Math.PI * 2;

        let hitZone = 'side';
        if (Math.abs(relAngle) < Math.PI / 4) hitZone = 'front';
        else if (Math.abs(relAngle) > 3 * Math.PI / 4) hitZone = 'rear';

        let effectiveArmor = this.armor[hitZone].current;
        this.armor[hitZone].current = Math.max(0, this.armor[hitZone].current - 1); 

        let finalDamage = Math.floor(baseDamage - effectiveArmor);
        if (finalDamage < 5) finalDamage = 5; 

        this.hp -= finalDamage;
        let isDestroyed = this.hp <= 0;
        if (this.hp < 0) this.hp = 0;
        return { hit: true, damage: finalDamage, destroyed: isDestroyed };
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
                let distFront = Math.abs(halfW - localX); let distRear = Math.abs(-halfW - localX); let distSide1 = Math.abs(halfH - localY); let distSide2 = Math.abs(-halfH - localY); 
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
                
                if (this.shieldTimer > 0) return { hit: true, zone: hitZone, x: px, y: py, nx: worldNx, ny: worldNy, type: 'ricochet', damage: 0 };

                let isGatling = bullet.ownerTank && bullet.ownerTank.turretName === "Гатлинг";
                
                if (isGatling) {
                    let life = bullet.lifeTime || 0;
                    // Исправлен дефолтный таймер на 0.4
                    let maxLife = bullet.maxLifeTime || 0.4;
                    let ratio = life / maxLife;
                    if (ratio > 1) ratio = 1;
                    if (ratio < 0) ratio = 0;
                    
                    let maxDmg = bullet.penetration; 
                    let minDmg = 1;                  
                    
                    let currentDmg = maxDmg - (maxDmg - minDmg) * ratio;
                    
                    let variance = Math.random() * (currentDmg * 0.2) - (currentDmg * 0.1);
                    let finalDamage = Math.round(currentDmg + variance);
                    if (finalDamage < 1) finalDamage = 1;
                    
                    let isDestroyed = false; if (this.hp > 0 && this.hp - finalDamage <= 0) isDestroyed = true;
                    this.hp -= finalDamage; if (this.hp < 0) this.hp = 0;
                    
                    return { hit: true, zone: hitZone, x: px, y: py, nx: worldNx, ny: worldNy, type: 'penetration', damage: finalDamage, destroyed: isDestroyed };
                }

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
                    return { hit: true, zone: hitZone, x: px, y: py, nx: worldNx, ny: worldNy, type: 'penetration', damage: finalDamage, destroyed: isDestroyed };
                } else { 
                    return { hit: true, zone: hitZone, x: px, y: py, nx: worldNx, ny: worldNy, type: 'ricochet', damage: 0 }; 
                }
            }
        }
        return { hit: false };
    }

    draw(ctx) {
        if (this.hp <= 0) return;
        if (this.shieldTimer > 0) {
            ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = '#0088ff'; ctx.strokeStyle = `rgba(0, 136, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }

        for (let p of this.particles) { ctx.fillStyle = `rgba(100, 100, 100, ${p.life / p.maxLife * 0.5})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.save(); ctx.translate(this.x + 5, this.y + 5); ctx.rotate(this.hullAngle); ctx.filter = 'brightness(0) opacity(0.4)'; ctx.drawImage(this.hullImg, -this.hullWidth / 2, -this.hullHeight / 2, this.hullWidth, this.hullHeight); ctx.restore();
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.hullAngle); ctx.drawImage(this.hullImg, -this.hullWidth / 2, -this.hullHeight / 2, this.hullWidth, this.hullHeight); ctx.restore();
        
        let isGatlingSpinning = this.turretName === "Гатлинг" && this.gatlingSpinTimer > 0;
        let vibX = isGatlingSpinning ? (Math.random() - 0.5) * 2 : 0; let vibY = isGatlingSpinning ? (Math.random() - 0.5) * 4 : 0;

        ctx.save(); ctx.translate(this.x + 8, this.y + 8); ctx.rotate(this.turretAngle); ctx.filter = 'brightness(0) opacity(0.4)'; ctx.drawImage(this.turretImg, -this.turretWidth / 2 - this.recoil + vibX, -this.turretHeight / 2 + vibY, this.turretWidth, this.turretHeight); ctx.restore();
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.turretAngle); ctx.drawImage(this.turretImg, -this.turretWidth / 2 - this.recoil + vibX, -this.turretHeight / 2 + vibY, this.turretWidth, this.turretHeight);
        
        if (isGatlingSpinning) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffaa00' : '#ffea00'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0000';
            ctx.beginPath(); ctx.arc(this.turretWidth / 2 + 5 + Math.random()*10, vibY, 3 + Math.random()*3, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        }
        ctx.restore();

        let barWidth = 40; let hpPercent = this.hp / this.maxHp; let yOffset = this.y - this.hullHeight / 2 - 20;
        
        ctx.fillStyle = 'red'; ctx.fillRect(this.x - barWidth / 2, yOffset, barWidth, 4);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - barWidth / 2, yOffset, barWidth * hpPercent, 4);

        let reloadPercent = 0;
        if (this.isMagazineWeapon) { if (this.isReloading) { reloadPercent = 1 - (this.fireCooldown / this.reloadTime); } else { reloadPercent = this.ammo / this.maxAmmo; } } 
        else { reloadPercent = 1 - (this.fireCooldown / this.fireRate); }
        
        if (reloadPercent < 0) reloadPercent = 0; if (reloadPercent > 1) reloadPercent = 1;
        
        ctx.fillStyle = '#444'; ctx.fillRect(this.x - barWidth / 2, yOffset + 5, barWidth, 3);
        ctx.fillStyle = (this.isMagazineWeapon && !this.isReloading) ? '#00ccff' : '#ffaa00'; ctx.fillRect(this.x - barWidth / 2, yOffset + 5, barWidth * reloadPercent, 3);

        if (this.hullName === "Титан") {
            ctx.fillStyle = '#00ffcc'; 
            ctx.font = 'bold 12px Arial'; 
            ctx.textAlign = 'center';
            let remainingMines = this.maxMines - this.minesPlaced;
            ctx.fillText("Мины: " + remainingMines, this.x, this.y + this.hullHeight / 2 + 20);
        }
    }
}
