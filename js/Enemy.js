import { Tank } from './Tank.js';

export class Enemy extends Tank {
    // Врагу мы тоже будем передавать его статы
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        
        // Переопределяем только логику поведения (ИИ)
        this.turretRotationSpeed = 0.5; 
        this.aiState = 'drive'; 
        this.aiTimer = 2;       
        this.turnDir = 0;       
    }

    updateAI(dt, arena, player) {
        this.aiTimer -= dt;

        if (this.aiTimer <= 0) {
            if (this.aiState === 'drive') {
                this.aiState = 'turn';
                this.turnDir = Math.random() > 0.5 ? 1 : -1; 
                this.aiTimer = 1 + Math.random() * 2; 
            } else {
                this.aiState = 'drive';
                this.turnDir = 0;
                this.aiTimer = 2 + Math.random() * 3; 
            }
        }

        if (this.aiState === 'drive' && Math.abs(this.currentSpeed) < 5 && this.aiTimer < 1.5) {
            this.aiState = 'turn';
            this.turnDir = 1;
            this.aiTimer = 1.5;
        }

        const fakeInput = {
            isForward: () => this.aiState === 'drive',
            isBackward: () => false,
            isLeft: () => this.turnDir === -1,
            isRight: () => this.turnDir === 1,
            mouseX: player.x, 
            mouseY: player.y
        };

        this.update(dt, fakeInput, arena);

        let targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
        let angleDiff = targetAngle - this.turretAngle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

        if (Math.abs(angleDiff) < 0.1 && this.tryShoot()) {
            return true; 
        }
        return false;
    }
}

