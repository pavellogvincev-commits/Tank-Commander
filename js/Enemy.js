import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        
        this.turretRotationSpeed = 0.5; 
        this.aiState = 'drive'; 
        this.aiTimer = 2;       
        this.turnDir = 0;       
    }

    updateAI(dt, arena, playerTank) {
        if (this.hp <= 0) return;
        
        // ОБЯЗАТЕЛЬНО обновляем таймеры оружия для работы очередей (Burst)
        this.updateWeapons(dt);

        this.aiTimer -= dt;

        if (this.aiTimer <= 0) {
            let r = Math.random();
            if (r < 0.5) { this.aiState = 'drive'; this.aiTimer = 1 + Math.random() * 2; } 
            else if (r < 0.8) { this.aiState = 'turn'; this.aiTimer = 0.5 + Math.random() * 1.5; this.turnDir = Math.random() > 0.5 ? 1 : -1; } 
            else { this.aiState = 'stop'; this.aiTimer = 1 + Math.random() * 1; }
        }

        let speed = 0;
        if (this.aiState === 'drive') speed = this.maxForwardSpeed * 0.7;
        else if (this.aiState === 'turn') { speed = this.maxForwardSpeed * 0.4; this.hullAngle += this.turnDir * this.hullRotationSpeed * dt; }

        let vx = Math.cos(this.hullAngle) * speed;
        let vy = Math.sin(this.hullAngle) * speed;

        let nextX = this.x + vx * dt;
        let nextY = this.y + vy * dt;

        let colX = arena.checkCollision(nextX, this.y, this.radius);
        let colY = arena.checkCollision(this.x, nextY, this.radius);

        if (colX || colY) { this.aiState = 'turn'; this.turnDir = Math.random() > 0.5 ? 1 : -1; this.aiTimer = 1; } 
        else { this.x = nextX; this.y = nextY; }

        let dx = playerTank.x - this.x;
        let dy = playerTank.y - this.y;
        let targetAngle = Math.atan2(dy, dx);

        let angleDiff = targetAngle - this.turretAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) > 0.05) {
            this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;
        }

        // Если ИИ навелся на игрока - он нажимает "спуск"
        if (Math.abs(angleDiff) < 0.2) {
            this.tryShoot(); 
        }
    }
}
