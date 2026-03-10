import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        this.turretRotationSpeed = 1.0; 
        this.aiType = hullStats.name === "Скаут" ? 'scout' : 'basic';
        this.aiState = 'drive'; this.aiTimer = 2; this.turnDir = 0;
        this.circleDir = Math.random() > 0.5 ? 1 : -1;
        this.stuckTimer = 0; 
    }

    // ОБНОВЛЕНО: Получаем enemies
    updateAI(dt, arena, playerTank, enemies) {
        if (this.hp <= 0) return;
        this.updateWeapons(dt);

        let dx = playerTank.x - this.x; let dy = playerTank.y - this.y;
        let distToPlayer = Math.sqrt(dx * dx + dy * dy); let angleToPlayer = Math.atan2(dy, dx);
        let hasLOS = arena.hasLineOfSight(this.x, this.y, playerTank.x, playerTank.y);

        if (this.stuckTimer > 0) this.stuckTimer -= dt;

        let targetSpeed = 0; let targetHullAngle = this.hullAngle; let isSmartMoving = false; 

        if (hasLOS && this.stuckTimer <= 0) {
            isSmartMoving = true;
            if (this.aiType === 'basic') {
                targetHullAngle = angleToPlayer;
                if (distToPlayer > 300) targetSpeed = this.maxForwardSpeed * 0.6; 
                else if (distToPlayer < 150) targetSpeed = this.maxReverseSpeed * 0.5; 
                else targetSpeed = 0; 
            } else if (this.aiType === 'scout') {
                if (distToPlayer > 200) { targetHullAngle = angleToPlayer; targetSpeed = this.maxForwardSpeed; } 
                else { targetHullAngle = angleToPlayer + (Math.PI / 2 * this.circleDir); targetSpeed = this.maxForwardSpeed; }
            }
        }

        if (!isSmartMoving) {
            this.aiTimer -= dt;
            if (this.aiTimer <= 0) {
                let r = Math.random();
                if (r < 0.5) { this.aiState = 'drive'; this.aiTimer = 1 + Math.random() * 2; } 
                else if (r < 0.8) { this.aiState = 'turn'; this.aiTimer = 0.5 + Math.random() * 1.5; this.turnDir = Math.random() > 0.5 ? 1 : -1; } 
                else { this.aiState = 'stop'; this.aiTimer = 1 + Math.random() * 1; }
            }
            if (this.aiState === 'drive') targetSpeed = this.maxForwardSpeed * 0.6;
            else if (this.aiState === 'turn') { targetSpeed = this.maxForwardSpeed * 0.4; this.hullAngle += this.turnDir * this.hullRotationSpeed * dt; }
        } else {
            let hullDiff = targetHullAngle - this.hullAngle;
            while (hullDiff > Math.PI) hullDiff -= Math.PI * 2; while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;
            if (Math.abs(hullDiff) > 0.05) this.hullAngle += Math.sign(hullDiff) * this.hullRotationSpeed * dt;
        }

        this.speed = targetSpeed; this.updateSmoke(dt); 

        let vx = Math.cos(this.hullAngle) * this.speed; let vy = Math.sin(this.hullAngle) * this.speed;
        let nextX = this.x + vx * dt; let nextY = this.y + vy * dt;

        // ПРОВЕРКА СТОЛКНОВЕНИЙ С ДРУГИМИ ТАНКАМИ
        let hitTanks = (checkX, checkY) => {
            let dxP = checkX - playerTank.x; let dyP = checkY - playerTank.y;
            if (playerTank.hp > 0 && Math.sqrt(dxP*dxP + dyP*dyP) < this.radius + playerTank.radius) return true;
            for (let e of enemies) {
                if (e === this || e.hp <= 0) continue;
                let distE = Math.sqrt(Math.pow(checkX - e.x, 2) + Math.pow(checkY - e.y, 2));
                if (distE < this.radius + e.radius) return true;
            }
            return false;
        };

        let colX = arena.checkCollision(nextX, this.y, this.radius) || hitTanks(nextX, this.y);
        let colY = arena.checkCollision(this.x, nextY, this.radius) || hitTanks(this.x, nextY);

        if (colX || colY) { 
            this.stuckTimer = 1.0; this.aiState = 'turn'; this.turnDir = Math.random() > 0.5 ? 1 : -1; this.aiTimer = 1;
            if (this.aiType === 'scout') this.circleDir *= -1;
        } else { this.x = nextX; this.y = nextY; }

        let angleDiff = angleToPlayer - this.turretAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) > 0.05) this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;

        if (Math.abs(angleDiff) < 0.2 && hasLOS) this.tryShoot(); 
    }
}
