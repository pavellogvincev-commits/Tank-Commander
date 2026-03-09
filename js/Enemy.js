import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        this.turretRotationSpeed = 0.5; 
        this.aiState = 'drive'; this.aiTimer = 2; this.turnDir = 0;       
    }

    updateAI(dt, arena, playerTank) {
        if (this.hp <= 0) return;
        
        this.updateWeapons(dt);

        this.aiTimer -= dt;
        if (this.aiTimer <= 0) {
            let r = Math.random();
            if (r < 0.5) { this.aiState = 'drive'; this.aiTimer = 1 + Math.random() * 2; } 
            else if (r < 0.8) { this.aiState = 'turn'; this.aiTimer = 0.5 + Math.random() * 1.5; this.turnDir = Math.random() > 0.5 ? 1 : -1; } 
            else { this.aiState = 'stop'; this.aiTimer = 1 + Math.random() * 1; }
        }

        // Вычисляем скорость
        let targetSpeed = 0;
        if (this.aiState === 'drive') targetSpeed = this.maxForwardSpeed * 0.7;
        else if (this.aiState === 'turn') { 
            targetSpeed = this.maxForwardSpeed * 0.4; 
            this.hullAngle += this.turnDir * this.hullRotationSpeed * dt; 
        }

        // Обновляем текущую скорость для генератора дыма
        this.speed = targetSpeed;
        this.updateSmoke(dt); // <--- ВРАГИ ТЕПЕРЬ ТОЖЕ ДЫМЯТ!

        let vx = Math.cos(this.hullAngle) * this.speed; 
        let vy = Math.sin(this.hullAngle) * this.speed;
        let nextX = this.x + vx * dt; 
        let nextY = this.y + vy * dt;

        if (arena.checkCollision(nextX, this.y, this.radius) || arena.checkCollision(this.x, nextY, this.radius)) { 
            this.aiState = 'turn'; this.turnDir = Math.random() > 0.5 ? 1 : -1; this.aiTimer = 1; 
        } else { this.x = nextX; this.y = nextY; }

        let targetAngle = Math.atan2(playerTank.y - this.y, playerTank.x - this.x);
        let angleDiff = targetAngle - this.turretAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) > 0.05) this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;

        if (Math.abs(angleDiff) < 0.2) this.tryShoot(); 
    }
}
