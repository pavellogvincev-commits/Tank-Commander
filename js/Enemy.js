import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        
        // Переменные для нового ИИ
        this.aiType = hullStats.name; // Запоминаем тип танка (Базовый, Скаут, Демон)
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
        this.evadeTimer = 0;
        this.evadeDir = 1; // Направление обхода: 1 (вправо) или -1 (влево)
        this.stateTimer = 0;
        this.randomAngleOffset = 0;
    }

    updateAI(dt, arena, playerTank, enemies) {
        if (this.hp <= 0 || !playerTank || playerTank.hp <= 0) return;
         // ЕСЛИ ВРАГ ОГЛУШЕН - ОН СТОИТ И НЕ СТРЕЛЯЕТ
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return; 
        }

        let distToPlayer = Math.sqrt(Math.pow(this.x - playerTank.x, 2) + Math.pow(this.y - playerTank.y, 2));
        let hasLoS = arena.hasLineOfSight(this.x, this.y, playerTank.x, playerTank.y);
        let angleToPlayer = Math.atan2(playerTank.y - this.y, playerTank.x - this.x);

        let shouldMove = true;
        let targetHullAngle = angleToPlayer;

        // ==========================================
        // 1. ХАРАКТЕР ПОВЕДЕНИЯ (По типам танков)
        // ==========================================
        if (this.aiType === "Враг-Базовый") {
            // Классика: подъезжает и останавливается для выстрела
            if (hasLoS && distToPlayer < 400) shouldMove = false; 
        } 
        else if (this.aiType === "Скаут") {
            // Скаут кружит вокруг игрока, постоянно в движении
            if (hasLoS && distToPlayer < 350) {
                targetHullAngle = angleToPlayer + (Math.PI / 2.5) * this.evadeDir; 
            }
        } 
        else if (this.aiType === "Демон") {
            // Демон рашит зигзагами, чтобы сложнее было попасть
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

        // ==========================================
        // 2. АНТИ-ЗАСТРЕВАНИЕ (Обход стен)
        // ==========================================
        this.stuckTimer += dt;
        if (this.stuckTimer > 0.5) {
            let distMoved = Math.sqrt(Math.pow(this.x - this.lastX, 2) + Math.pow(this.y - this.lastY, 2));
            
            // Если танк должен ехать, но за 0.5 сек сдвинулся меньше чем на 15 пикселей - он застрял
            if (shouldMove && distMoved < 15) {
                this.evadeTimer = 2.0; // Включаем режим обхода стены на 2 секунды
                this.evadeDir = Math.random() > 0.5 ? 1 : -1;
            }
            this.lastX = this.x;
            this.lastY = this.y;
            this.stuckTimer = 0;
        }

        // Если включен режим обхода стены - едем вбок
        if (this.evadeTimer > 0) {
            this.evadeTimer -= dt;
            shouldMove = true;
            targetHullAngle = angleToPlayer + (Math.PI / 2) * this.evadeDir;
        }

        // ==========================================
        // 3. ПРИМЕНЕНИЕ ДВИЖЕНИЯ И ВРАЩЕНИЯ
        // ==========================================
        // Создаем "фейковый" ввод, чтобы скормить его базовому классу Tank
        let fakeInput = {
            isUp: () => shouldMove,
            isDown: () => false,
            isLeft: () => false,
            isRight: () => false,
            getMouseX: () => playerTank.x, // Башня всегда следит за игроком
            getMouseY: () => playerTank.y,
            isShooting: () => false 
        };

        if (shouldMove) {
             let hullDiff = targetHullAngle - this.hullAngle;
             while (hullDiff > Math.PI) hullDiff -= Math.PI * 2;
             while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;
             
             // Поворачиваем корпус
             if (Math.abs(hullDiff) > 0.1) {
                 if (hullDiff > 0) fakeInput.isRight = () => true;
                 else fakeInput.isLeft = () => true;
             }
        }

        // Вызываем базовую физику (движение корпуса и поворот башни за "мышкой")
        super.update(dt, fakeInput, arena, enemies);

        // ==========================================
        // 4. ЛОГИКА СТРЕЛЬБЫ
        // ==========================================
        let aimDiff = angleToPlayer - this.turretAngle;
        while (aimDiff > Math.PI) aimDiff -= Math.PI * 2;
        while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;

        // Если есть прямая видимость и пушка смотрит примерно на игрока - стреляем!
        if (hasLoS && Math.abs(aimDiff) < 0.15) {
            this.tryShoot();
        }
    }
}

