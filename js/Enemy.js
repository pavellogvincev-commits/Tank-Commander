import { Tank } from './Tank.js';

// Enemy "расширяет" класс Tank, забирая себе всю его физику и отрисовку
export class Enemy extends Tank {
    constructor(x, y, hullImg, turretImg) {
        // super вызывает constructor оригинального Tank.js
        super(x, y, hullImg, turretImg);
        
        this.maxHp = 100; // У врага 100 ХП
        this.hp = 100;

        // Броня врага (сделаем чуть слабее)
        this.armor = {
            front: { current: 60, max: 60 },
            side:  { current: 30, max: 30 },
            rear:  { current: 15, max: 15 }
        };
        // Переопределяем характеристики врага (сделаем его слабее игрока)
        this.maxForwardSpeed = 30; // Ездит медленнее
        this.fireRate = 2.0;       // Стреляет раз в 2 секунды (игрок раз в 1 сек)
        this.turretRotationSpeed = 0.5; // Башня крутится медленнее (чтобы от него можно было увернуться)

        // Искусственный интеллект (AI)
        this.aiState = 'drive'; // Состояния: 'drive' (ехать) или 'turn' (поворачивать)
        this.aiTimer = 2;       // Таймер смены действий
        this.turnDir = 0;       // Направление поворота: 1 или -1
    }

    // Метод обновления специально для врага
    updateAI(dt, arena, player) {
        this.aiTimer -= dt;

        // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ (Мозг врага) ---
        if (this.aiTimer <= 0) {
            if (this.aiState === 'drive') {
                this.aiState = 'turn';
                this.turnDir = Math.random() > 0.5 ? 1 : -1; // Случайный поворот вправо или влево
                this.aiTimer = 1 + Math.random() * 2; // Поворачивает 1-3 секунды
            } else {
                this.aiState = 'drive';
                this.turnDir = 0;
                this.aiTimer = 2 + Math.random() * 3; // Едет прямо 2-5 секунд
            }
        }

        // Защита от застревания: если он едет, но скорость упала (уперся в стену) -> заставляем повернуть
        if (this.aiState === 'drive' && Math.abs(this.currentSpeed) < 5 && this.aiTimer < 1.5) {
            this.aiState = 'turn';
            this.turnDir = 1;
            this.aiTimer = 1.5;
        }

        // --- СОЗДАЕМ "ФЕЙКОВЫЕ" КНОПКИ ДЛЯ ТАНКА ---
        // Мы обманываем оригинальный Tank.js, подсовывая ему этот объект вместо реальной клавиатуры/мыши
        const fakeInput = {
            isForward: () => this.aiState === 'drive',
            isBackward: () => false,
            isLeft: () => this.turnDir === -1,
            isRight: () => this.turnDir === 1,
            mouseX: player.x,  // Башня всегда будет тянуться к координатам игрока
            mouseY: player.y
        };

        // Запускаем физику танка, используя фейковые кнопки
        this.update(dt, fakeInput, arena);

        // --- ЛОГИКА СТРЕЛЬБЫ ---
        // Проверяем, смотрит ли дуло на игрока
        let targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
        let angleDiff = targetAngle - this.turretAngle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

        // Если башня направлена на игрока (с погрешностью 0.1 радиан) и пушка заряжена
        if (Math.abs(angleDiff) < 0.1 && this.tryShoot()) {
            return true; // Враг хочет выстрелить!
        }
        return false;
    }

}
