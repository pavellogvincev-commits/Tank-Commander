import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        this.aiType = hullStats.name; 
        this.evadeDir = Math.random() > 0.5 ? 1 : -1; 
        this.behaviorTimer = 0;
    }

    updateAI(dt, arena, playerTank, enemies) {
        if (this.hp <= 0) return;

        let idleInput = { isUp: () => false, isDown: () => false, isLeft: () => false, isRight: () => false, getMouseX: () => this.x + Math.cos(this.turretAngle) * 100, getMouseY: () => this.y + Math.sin(this.turretAngle) * 100, isShooting: () => false };

        if (!playerTank || playerTank.hp <= 0 || this.stunTimer > 0) {
            if (this.stunTimer > 0) this.stunTimer -= dt;
            super.update(dt, idleInput, arena, enemies); return; 
        }

        let distToPlayer = Math.sqrt(Math.pow(this.x - playerTank.x, 2) + Math.pow(this.y - playerTank.y, 2));
        let hasLoS = arena.hasLineOfSight(this.x, this.y, playerTank.x, playerTank.y);
        let angleToPlayer = Math.atan2(playerTank.y - this.y, playerTank.x - this.x);
        let shouldMove = true; let desiredAngle = angleToPlayer; 

        if (this.aiType === "Враг-Базовый") {
            if (hasLoS && distToPlayer < 450) shouldMove = false; 
        } else if (this.aiType === "Скаут") {
            if (distToPlayer < 250) desiredAngle = angleToPlayer + (Math.PI / 2.2) * this.evadeDir;
            else if (distToPlayer < 400 && hasLoS) desiredAngle = angleToPlayer + (Math.PI / 4) * this.evadeDir;
        } else if (this.aiType === "Демон") {
            this.behaviorTimer -= dt;
            if (this.behaviorTimer <= 0) { this.evadeDir = Math.random() > 0.5 ? 1 : -1; this.behaviorTimer = 1.5 + Math.random(); }
            if (hasLoS) {
                if (distToPlayer < 250) desiredAngle = angleToPlayer + Math.PI + (Math.PI / 3) * this.evadeDir; 
                else if (distToPlayer > 350) desiredAngle = angleToPlayer + (Math.PI / 4) * this.evadeDir;
                else desiredAngle = angleToPlayer + (Math.PI / 2) * this.evadeDir;
            }
        }

        // ОБНОВЛЕНО: Умный сенсор на СТЕНЫ и СОЮЗНИКОВ
        if (shouldMove) {
            let lookAhead = 70; let avoidForce = 0;
            let anglesToCheck = [-Math.PI/4, 0, Math.PI/4]; 
            
            for (let offset of anglesToCheck) {
                let checkAngle = this.hullAngle + offset;
                let checkX = this.x + Math.cos(checkAngle) * lookAhead;
                let checkY = this.y + Math.sin(checkAngle) * lookAhead;

                let isBlocked = arena.checkCollision(checkX, checkY, this.radius);
                
                // Проверка на союзников
                if (!isBlocked) {
                    for (let e of enemies) {
                        if (e !== this && e.hp > 0) {
                            let distToAlly = Math.sqrt(Math.pow(checkX - e.x, 2) + Math.pow(checkY - e.y, 2));
                            if (distToAlly < this.radius + e.radius + 15) { isBlocked = true; break; }
                        }
                    }
                }

                if (isBlocked) {
                    avoidForce += offset === 0 ? (Math.PI / 2) * this.evadeDir : (offset < 0 ? Math.PI/2 : -Math.PI/2);
                }
            }

            if (avoidForce !== 0) desiredAngle = this.hullAngle + avoidForce;

            // Анти-слипание (разъезд при физическом контакте)
            for (let e of enemies) {
                if (e !== this && e.hp > 0) {
                    let d = Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2));
                    if (d < this.radius * 2) {
                        desiredAngle = Math.atan2(this.y - e.y, this.x - e.x); // Едем прочь от центра союзника
                    }
                }
            }
        }

        let fakeInput = { isUp: () => shouldMove, isDown: () => false, isLeft: () => false, isRight: () => false, getMouseX: () => playerTank.x, getMouseY: () => playerTank.y, isShooting: () => false };

        if (shouldMove) {
             let hullDiff = desiredAngle - this.hullAngle;
             while (hullDiff > Math.PI) hullDiff -= Math.PI * 2; while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;
             if (Math.abs(hullDiff) > 0.1) { if (hullDiff > 0) fakeInput.isRight = () => true; else fakeInput.isLeft = () => true; }
        }

        super.update(dt, fakeInput, arena, enemies);

        let aimDiff = angleToPlayer - this.turretAngle;
        while (aimDiff > Math.PI) aimDiff -= Math.PI * 2; while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;
        if (hasLoS && Math.abs(aimDiff) < 0.15) this.tryShoot();
    }
}
