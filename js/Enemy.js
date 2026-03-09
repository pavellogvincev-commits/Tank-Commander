import { Tank } from './Tank.js';

export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg, hullStats, turretStats) {
        // Передаем все параметры в родительский класс Tank
        super(x, y, hullImg, turretImg, hullStats, turretStats);
        
        // Настройки поведения ИИ
        this.turretRotationSpeed = 0.5; // Враги крутят башней медленнее игрока
        this.aiState = 'drive';         // Текущее состояние: drive, turn, stop
        this.aiTimer = 2;               // Таймер до смены состояния
        this.turnDir = 0;               // Направление поворота корпуса (1 или -1)
    }

    // Метод обновления логики ИИ (движение и прицеливание)
    updateAI(dt, arena, playerTank) {
        if (this.hp <= 0) return;
        
        // ВАЖНО: Обновляем таймеры оружия, чтобы работала стрельба очередями!
        this.updateWeapons(dt);

        // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ ---
        this.aiTimer -= dt;

        if (this.aiTimer <= 0) {
            let r = Math.random();
            if (r < 0.5) { 
                this.aiState = 'drive'; 
                this.aiTimer = 1 + Math.random() * 2; 
            } else if (r < 0.8) { 
                this.aiState = 'turn'; 
                this.aiTimer = 0.5 + Math.random() * 1.5; 
                this.turnDir = Math.random() > 0.5 ? 1 : -1; 
            } else { 
                this.aiState = 'stop'; 
                this.aiTimer = 1 + Math.random() * 1; 
            }
        }

        let speed = 0;
        if (this.aiState === 'drive') {
            speed = this.maxForwardSpeed * 0.7;
        } else if (this.aiState === 'turn') { 
            speed = this.maxForwardSpeed * 0.4; 
            this.hullAngle += this.turnDir * this.hullRotationSpeed * dt; 
        }

        let vx = Math.cos(this.hullAngle) * speed;
        let vy = Math.sin(this.hullAngle) * speed;

        let nextX = this.x + vx * dt;
        let nextY = this.y + vy * dt;

        // Проверка столкновений со стенами арены
        let colX = arena.checkCollision(nextX, this.y, this.radius);
        let colY = arena.checkCollision(this.x, nextY, this.radius);

        if (colX || colY) { 
            // Если уперлись в стену - меняем состояние на поворот
            this.aiState = 'turn'; 
            this.turnDir = Math.random() > 0.5 ? 1 : -1; 
            this.aiTimer = 1; 
        } else { 
            this.x = nextX; 
            this.y = nextY; 
        }

        // --- ЛОГИКА ПРИЦЕЛИВАНИЯ И СТРЕЛЬБЫ ---
        let dx = playerTank.x - this.x;
        let dy = playerTank.y - this.y;
        let targetAngle = Math.atan2(dy, dx);

        let angleDiff = targetAngle - this.turretAngle;
        
        // Нормализация угла, чтобы башня крутилась по кратчайшему пути
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) > 0.05) {
            this.turretAngle += Math.sign(angleDiff) * this.turretRotationSpeed * dt;
        }

        // Если ИИ навелся на игрока (отклонение меньше 0.2 радиан) - нажимает спусковой крючок
        if (Math.abs(angleDiff) < 0.2) {
            this.tryShoot(); 
        }
    }
}
