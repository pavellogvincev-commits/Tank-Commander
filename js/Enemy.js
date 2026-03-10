import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        
        this.turretRotationSpeed = 1.0; 
        
        // Определяем тип ИИ по имени корпуса из базы данных
        this.aiType = hullStats.name === "Скаут" ? 'scout' : 'basic';
        
        // Переменные для блуждания и объезда препятствий
        this.aiState = 'drive'; 
        this.aiTimer = 2; 
        this.turnDir = 0;
        
        // Для скаута: направление кружения (по или против часовой стрелки)
        this.circleDir = Math.random() > 0.5 ? 1 : -1;
        
        // Таймер "паники", если танк уперся в стену во время атаки
        this.stuckTimer = 0; 
    }

    updateAI(dt, arena, playerTank) {
        if (this.hp <= 0) return;
        this.updateWeapons(dt);

        let dx = playerTank.x - this.x;
        let dy = playerTank.y - this.y;
        let distToPlayer = Math.sqrt(dx * dx + dy * dy);
        let angleToPlayer = Math.atan2(dy, dx);

        // 1. ПРОВЕРКА ВИДИМОСТИ (Простреливается ли прямая?)
        let hasLOS = arena.hasLineOfSight(this.x, this.y, playerTank.x, playerTank.y);

        if (this.stuckTimer > 0) this.stuckTimer -= dt;

        let targetSpeed = 0;
        let targetHullAngle = this.hullAngle; // По умолчанию не меняем угол
        let isSmartMoving = false; // Флаг: использует ли ИИ сейчас осмысленное движение

        // 2. ОСМЫСЛЕННОЕ ПОВЕДЕНИЕ (Только если видит игрока и не застрял в стене)
        if (hasLOS && this.stuckTimer <= 0) {
            isSmartMoving = true;

            if (this.aiType === 'basic') {
                // БАЗОВЫЙ: Старается встать лбом к игроку и медленно ехать (или стоять)
                targetHullAngle = angleToPlayer;
                
                if (distToPlayer > 300) {
                    targetSpeed = this.maxForwardSpeed * 0.6; // Ползет вперед
                } else if (distToPlayer < 150) {
                    targetSpeed = this.maxReverseSpeed * 0.5; // Сдает назад, если игрок лезет в упор
                } else {
                    targetSpeed = 0; // Встал в позицию и танкует
                }
                
            } else if (this.aiType === 'scout') {
                // СКАУТ: Сближается, а затем кружит вокруг игрока
                if (distToPlayer > 200) {
                    // Далеко - летим прямо на игрока
                    targetHullAngle = angleToPlayer;
                    targetSpeed = this.maxForwardSpeed;
                } else {
                    // Близко - летим перпендикулярно (плюс/минус 90 градусов)
                    targetHullAngle = angleToPlayer + (Math.PI / 2 * this.circleDir);
                    targetSpeed = this.maxForwardSpeed; // Скаут всегда на максималках
                }
            }
        }

        // 3. БЛУЖДАНИЕ / ОБЪЕЗД (Если нет прямой видимости или танк застрял)
        if (!isSmartMoving) {
            this.aiTimer -= dt;
            if (this.aiTimer <= 0) {
                let r = Math.random();
                if (r < 0.5) { this.aiState = 'drive'; this.aiTimer = 1 + Math.random() * 2; } 
                else if (r < 0.8) { this.aiState = 'turn'; this.aiTimer = 0.5 + Math.random() * 1.5; this.turnDir = Math.random() > 0.5 ? 1 : -1; } 
                else { this.aiState = 'stop'; this.aiTimer = 1 + Math.random() * 1; }
            }

            if (this.aiState === 'drive') targetSpeed = this.maxForwardSpeed * 0.6;
            else if (this.aiState === 'turn') { 
                targetSpeed = this.maxForwardSpeed * 0.4; 
                this.hullAngle += this.turnDir * this.hullRotationSpeed * dt; 
            }
        } else {
            // Плавный поворот корпуса для умного движения
            let hullDiff = targetHullAngle - this.hullAngle;
            while (hullDiff > Math.PI) hullDiff -= Math.PI * 2; 
            while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;

            if (Math.abs(hullDiff) > 0.05) {
                this.hullAngle += Math.sign(hullDiff) * this.hullRotationSpeed * dt;
            }
        }

        // 4. ПРИМЕНЕНИЕ ФИЗИКИ (Движение и коллизии)
        this.speed = targetSpeed;
        this.updateSmoke(dt); 

        let vx = Math.cos(this.hullAngle) * this.speed; 
        let vy = Math.sin(this.hullAngle) * this.speed;
        let nextX = this.x + vx * dt; 
        let nextY = this.y + vy * dt;

        let colX = arena.checkCollision(nextX, this.y, this.radius);
        let colY = arena.checkCollision(this.x, nextY, this.radius);

        if (colX || colY) { 
            // Если врезался в стену — включаем панику/объезд на секунду
            this.stuckTimer = 1.0; 
            this.aiState = 'turn'; 
            this.turnDir = Math.random() > 0.5 ? 1 : -1; 
            this.aiTimer = 1;
            
            // Если скаут врезался пока кружил - меняем направление кружения
            if (this.aiType === 'scout') this.circleDir *= -1;
        } else { 
            this.x = nextX; this.y = nextY; 
        }

        // 5. ПРИЦЕЛИВАНИЕ И СТРЕЛЬБА
        let angleDiff = angleToPlayer - this.turretAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; 
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) > 0.05) {
            this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;
        }

        // ВРАГ СТРЕЛЯЕТ ТОЛЬКО ЕСЛИ ПУШКА НАВЕДЕНА И ЕСТЬ ЛИНИЯ ВИДИМОСТИ!
        if (Math.abs(angleDiff) < 0.2 && hasLOS) {
            this.tryShoot(); 
        }
    }
}
