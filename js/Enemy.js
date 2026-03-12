import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        
        this.aiType = hullStats.name; 
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
        this.evadeTimer = 0;
        this.evadeDir = 1; 
        this.stateTimer = 0;
        this.randomAngleOffset = 0;
    }

    updateAI(dt, arena, playerTank, enemies) {
        if (this.hp <= 0) return;

        // ФИКС БАГА С "ЛАЗЕРОМ": Создаем нейтральный ввод (не ехать, не стрелять)
        let idleInput = {
            isUp: () => false, isDown: () => false, isLeft: () => false, isRight: () => false,
            getMouseX: () => this.x + Math.cos(this.turretAngle) * 100, 
            getMouseY: () => this.y + Math.sin(this.turretAngle) * 100,
            isShooting: () => false 
        };

        // Если игрок мертв или враг оглушен — враг просто плавно останавливается и остывает
        if (!playerTank || playerTank.hp <= 0 || this.stunTimer > 0) {
            if (this.stunTimer > 0) this.stunTimer -= dt;
            super.update(dt, idleInput, arena, enemies); // Обновляем физику и перезарядку пушки!
            return; 
        }

        let distToPlayer = Math.sqrt(Math.pow(this.x - playerTank.x, 2) + Math.pow(this.y - playerTank.y, 2));
        let hasLoS = arena.hasLineOfSight(this.x, this.y, playerTank.x, playerTank.y);
        let angleToPlayer = Math.atan2(playerTank.y - this.y, playerTank.x - this.x);

        let shouldMove = true;
        let targetHullAngle = angleToPlayer;

        if (this.aiType === "Враг-Базовый") {
            if (hasLoS && distToPlayer < 400) shouldMove = false; 
        } 
        else if (this.aiType === "Скаут") {
            if (hasLoS && distToPlayer < 350) {
                targetHullAngle = angleToPlayer + (Math.PI / 2.5) * this.evadeDir; 
            }
        } 
        else if (this.aiType === "Демон") {
            this.stateTimer += dt;
            if (this.stateTimer > 1.5) {
                this.stateTimer = 0;
                this.randomAngleOffset = (Math.random() - 0.5) * (Math.PI / 1.5); 
            }
            if (hasLoS && distToPlayer < 200) {
                targetHullAngle = angleToPlayer + (Math.PI / 2) * this.evadeDir; 
            } else {
                targetHullAngle = angleToPlayer + this.randomAngleOffset;
            }
        }

        this.stuckTimer += dt;
        if (this.stuckTimer > 0.5) {
            let distMoved = Math.sqrt(Math.pow(this.x - this.lastX, 2) + Math.pow(this.y - this.lastY, 2));
            if (shouldMove && distMoved < 15) {
                this.evadeTimer = 2.0; 
                this.evadeDir = Math.random() > 0.5 ? 1 : -1;
            }
            this.lastX = this.x;
            this.lastY = this.y;
            this.stuckTimer = 0;
        }

        if (this.evadeTimer > 0) {
            this.evadeTimer -= dt;
            shouldMove = true;
            targetHullAngle = angleToPlayer + (Math.PI / 2) * this.evadeDir;
        }

        let fakeInput = {
            isUp: () => shouldMove,
            isDown: () => false,
            isLeft: () => false,
            isRight: () => false,
            getMouseX: () => playerTank.x, 
            getMouseY: () => playerTank.y,
            isShooting: () => false 
        };

        if (shouldMove) {
             let hullDiff = targetHullAngle - this.hullAngle;
             while (hullDiff > Math.PI) hullDiff -= Math.PI * 2;
             while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;
             
             if (Math.abs(hullDiff) > 0.1) {
                 if (hullDiff > 0) fakeInput.isRight = () => true;
                 else fakeInput.isLeft = () => true;
             }
        }

        super.update(dt, fakeInput, arena, enemies);

        let aimDiff = angleToPlayer - this.turretAngle;
        while (aimDiff > Math.PI) aimDiff -= Math.PI * 2;
        while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;

        if (hasLoS && Math.abs(aimDiff) < 0.15) {
            this.tryShoot();
        }
    }
}
