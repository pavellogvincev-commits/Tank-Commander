import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        this.aiType = hullStats.name; 
        this.evadeDir = Math.random() > 0.5 ? 1 : -1; // Направление кружения (по/против часовой)
        this.behaviorTimer = 0;
    }

    updateAI(dt, arena, playerTank, enemies) {
        if (this.hp <= 0) return;

        let idleInput = {
            isUp: () => false, isDown: () => false, isLeft: () => false, isRight: () => false,
            getMouseX: () => this.x + Math.cos(this.turretAngle) * 100, 
            getMouseY: () => this.y + Math.sin(this.turretAngle) * 100,
            isShooting: () => false 
        };

        if (!playerTank || playerTank.hp <= 0 || this.stunTimer > 0) {
            if (this.stunTimer > 0) this.stunTimer -= dt;
            super.update(dt, idleInput, arena, enemies); 
            return; 
        }

        let distToPlayer = Math.sqrt(Math.pow(this.x - playerTank.x, 2) + Math.pow(this.y - playerTank.y, 2));
        let hasLoS = arena.hasLineOfSight(this.x, this.y, playerTank.x, playerTank.y);
        let angleToPlayer = Math.atan2(playerTank.y - this.y, playerTank.x - this.x);

        let shouldMove = true;
        let desiredAngle = angleToPlayer; // Куда мы в идеале хотим ехать

        // ==========================================
        // 1. СТРАТЕГИИ ПОВЕДЕНИЯ
        // ==========================================
        if (this.aiType === "Враг-Базовый") {
            // Базовый: Видишь - стой и стреляй. Не видишь - едь к игроку.
            if (hasLoS && distToPlayer < 450) {
                shouldMove = false; 
            }
        } 
        else if (this.aiType === "Скаут") {
            // Скаут: Подъезжает и начинает кружить вокруг (на 90 градусов от игрока)
            if (distToPlayer < 250) {
                desiredAngle = angleToPlayer + (Math.PI / 2.2) * this.evadeDir;
            } else if (distToPlayer < 400 && hasLoS) {
                desiredAngle = angleToPlayer + (Math.PI / 4) * this.evadeDir; // Заходит по спирали
            }
        } 
        else if (this.aiType === "Демон") {
            // Демон: Держит дистанцию 300. Ближе - пятится, дальше - нападает. Агрессивно маневрирует.
            this.behaviorTimer -= dt;
            if (this.behaviorTimer <= 0) {
                this.evadeDir = Math.random() > 0.5 ? 1 : -1;
                this.behaviorTimer = 1.5 + Math.random();
            }

            if (hasLoS) {
                if (distToPlayer < 250) {
                    // Игрок слишком близко - отступаем зигзагом
                    desiredAngle = angleToPlayer + Math.PI + (Math.PI / 3) * this.evadeDir; 
                } else if (distToPlayer > 350) {
                    // Игрок далеко - сближаемся зигзагом
                    desiredAngle = angleToPlayer + (Math.PI / 4) * this.evadeDir;
                } else {
                    // Идеальная дистанция ~300 - стрейфимся (движемся боком)
                    desiredAngle = angleToPlayer + (Math.PI / 2) * this.evadeDir;
                }
            }
        }

        // ==========================================
        // 2. СИСТЕМА ОБХОДА ПРЕПЯТСТВИЙ (СЕНСОРЫ)
        // ==========================================
        if (shouldMove) {
            let lookAhead = 60; // Длина сенсора
            let avoidForce = 0;

            // Бросаем 3 "луча" перед танком: по центру, слева и справа
            let anglesToCheck = [-Math.PI/4, 0, Math.PI/4]; 
            
            for (let offset of anglesToCheck) {
                let checkAngle = this.hullAngle + offset;
                let checkX = this.x + Math.cos(checkAngle) * lookAhead;
                let checkY = this.y + Math.sin(checkAngle) * lookAhead;

                if (arena.checkCollision(checkX, checkY, this.radius)) {
                    // Если уперлись, толкаем танк в противоположную сторону от препятствия
                    avoidForce += offset === 0 ? (Math.PI / 2) * this.evadeDir : (offset < 0 ? Math.PI/2 : -Math.PI/2);
                }
            }

            // Если сенсоры сработали, приоритет отдается объезду стены
            if (avoidForce !== 0) {
                desiredAngle = this.hullAngle + avoidForce;
            }
        }

        // ==========================================
        // 3. ПРИМЕНЕНИЕ ДВИЖЕНИЯ
        // ==========================================
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
             let hullDiff = desiredAngle - this.hullAngle;
             while (hullDiff > Math.PI) hullDiff -= Math.PI * 2;
             while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;
             
             if (Math.abs(hullDiff) > 0.1) {
                 if (hullDiff > 0) fakeInput.isRight = () => true;
                 else fakeInput.isLeft = () => true;
             }
        }

        super.update(dt, fakeInput, arena, enemies);

        // ==========================================
        // 4. ЛОГИКА СТРЕЛЬБЫ
        // ==========================================
        let aimDiff = angleToPlayer - this.turretAngle;
        while (aimDiff > Math.PI) aimDiff -= Math.PI * 2;
        while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;

        if (hasLoS && Math.abs(aimDiff) < 0.15) {
            this.tryShoot();
        }
    }
}
