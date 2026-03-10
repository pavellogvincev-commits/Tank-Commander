import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        this.turretRotationSpeed = 1.0; 
        this.aiType = hullStats.name === "Скаут" ? 'scout' : 'basic';
        this.aiState = 'drive'; this.aiTimer = 2; this.turnDir = 0;
        this.circleDir = Math.random() > 0.5 ? 1 : -1;
    }

    updateAI(dt, arena, playerTank, enemies) {
        if (this.hp <= 0) return;
        this.updateWeapons(dt);

        let dx = playerTank.x - this.x; let dy = playerTank.y - this.y;
        let distToPlayer = Math.sqrt(dx * dx + dy * dy); let angleToPlayer = Math.atan2(dy, dx);
        let hasLOS = arena.hasLineOfSight(this.x, this.y, playerTank.x, playerTank.y);

        let targetSpeed = 0; 
        let targetHullAngle = this.hullAngle; 
        let isSmartMoving = false; 

        // 1. ОПРЕДЕЛЯЕМ БАЗОВУЮ ЦЕЛЬ ДВИЖЕНИЯ
        if (hasLOS) {
            isSmartMoving = true;
            if (this.aiType === 'basic') {
                targetHullAngle = angleToPlayer;
                if (distToPlayer > 300) targetSpeed = this.maxForwardSpeed * 0.8; 
                else if (distToPlayer < 150) targetSpeed = this.maxReverseSpeed * 0.5; 
                else targetSpeed = 0; 
            } else if (this.aiType === 'scout') {
                if (distToPlayer > 200) { targetHullAngle = angleToPlayer; targetSpeed = this.maxForwardSpeed; } 
                else { targetHullAngle = angleToPlayer + (Math.PI / 2 * this.circleDir); targetSpeed = this.maxForwardSpeed; }
            }
        } else {
            // Если игрока не видно - просто катаемся
            this.aiTimer -= dt;
            if (this.aiTimer <= 0) {
                let r = Math.random();
                if (r < 0.5) { this.aiState = 'drive'; this.aiTimer = 1 + Math.random() * 2; } 
                else if (r < 0.8) { this.aiState = 'turn'; this.aiTimer = 0.5 + Math.random() * 1.5; this.turnDir = Math.random() > 0.5 ? 1 : -1; } 
                else { this.aiState = 'stop'; this.aiTimer = 1 + Math.random() * 1; }
            }
            if (this.aiState === 'drive') targetSpeed = this.maxForwardSpeed * 0.6;
            else if (this.aiState === 'turn') { targetSpeed = this.maxForwardSpeed * 0.4; this.hullAngle += this.turnDir * this.hullRotationSpeed * dt; }
        }

        // 2. СЕНСОРЫ ОГИБАНИЯ ПРЕПЯТСТВИЙ (WHISKERS AI)
        // Если танк куда-то едет, он проверяет пространство впереди-слева и впереди-справа
        if (targetSpeed > 0) {
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

            let whiskerDist = this.radius + 30; // Смотрим на 30 пикселей вперед
            let sensorAngle = 0.5; // Угол "усиков" (около 30 градусов)

            let sensorL_X = this.x + Math.cos(this.hullAngle - sensorAngle) * whiskerDist;
            let sensorL_Y = this.y + Math.sin(this.hullAngle - sensorAngle) * whiskerDist;
            let blockedL = arena.checkCollision(sensorL_X, sensorL_Y, 5) || hitTanks(sensorL_X, sensorL_Y);

            let sensorR_X = this.x + Math.cos(this.hullAngle + sensorAngle) * whiskerDist;
            let sensorR_Y = this.y + Math.sin(this.hullAngle + sensorAngle) * whiskerDist;
            let blockedR = arena.checkCollision(sensorR_X, sensorR_Y, 5) || hitTanks(sensorR_X, sensorR_Y);

            // КОРРЕКТИРУЕМ КУРС, если впереди стена
            if (blockedL && !blockedR) {
                targetHullAngle = this.hullAngle + 1.5; // Рулим круто вправо
                targetSpeed *= 0.6; // Притормаживаем
                isSmartMoving = true;
            } else if (blockedR && !blockedL) {
                targetHullAngle = this.hullAngle - 1.5; // Рулим круто влево
                targetSpeed *= 0.6;
                isSmartMoving = true;
            } else if (blockedL && blockedR) {
                targetHullAngle = this.hullAngle + Math.PI; // Уперлись рогом - разворот
                targetSpeed = this.maxReverseSpeed;
                isSmartMoving = true;
            }
        }

        // Применяем плавный поворот
        if (isSmartMoving) {
            let hullDiff = targetHullAngle - this.hullAngle;
            while (hullDiff > Math.PI) hullDiff -= Math.PI * 2; while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;
            if (Math.abs(hullDiff) > 0.05) this.hullAngle += Math.sign(hullDiff) * this.hullRotationSpeed * dt;
        }

        // 3. ФИЗИКА ДВИЖЕНИЯ
        this.speed = targetSpeed; this.updateSmoke(dt); 
        let vx = Math.cos(this.hullAngle) * this.speed; let vy = Math.sin(this.hullAngle) * this.speed;
        let nextX = this.x + vx * dt; let nextY = this.y + vy * dt;

        // Физические жесткие столкновения (если не успели увернуть)
        let hitTanksHard = (checkX, checkY) => {
            let dxP = checkX - playerTank.x; let dyP = checkY - playerTank.y;
            if (playerTank.hp > 0 && Math.sqrt(dxP*dxP + dyP*dyP) < this.radius + playerTank.radius) return true;
            for (let e of enemies) {
                if (e === this || e.hp <= 0) continue;
                let distE = Math.sqrt(Math.pow(checkX - e.x, 2) + Math.pow(checkY - e.y, 2));
                if (distE < this.radius + e.radius) return true;
            }
            return false;
        };

        let colX = arena.checkCollision(nextX, this.y, this.radius) || hitTanksHard(nextX, this.y);
        let colY = arena.checkCollision(this.x, nextY, this.radius) || hitTanksHard(this.x, nextY);

        if (colX || colY) {
            if (this.aiType === 'scout') this.circleDir *= -1; // Меняем сторону облета
            // Если врезались - ИИ на долю секунды переходит в блуждание
            this.aiState = 'turn'; this.turnDir = Math.random() > 0.5 ? 1 : -1; this.aiTimer = 0.5;
        } else { 
            this.x = nextX; this.y = nextY; 
        }

        // 4. ПРИЦЕЛИВАНИЕ И СТРЕЛЬБА
        let angleDiff = angleToPlayer - this.turretAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) > 0.05) this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;

        if (Math.abs(angleDiff) < 0.2 && hasLOS) this.tryShoot(); 
    }
}
