export class Input {
    constructor(canvas) {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.shooting = false;

        // Отслеживаем нажатия клавиатуры
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Отслеживаем мышь для поворота башни
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // Отслеживаем клик мыши для стрельбы
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.shooting = true; // Левая кнопка мыши
        });

        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.shooting = false;
        });
    }

    // Методы, которые запрашивает Tank.js
    isUp() { return this.keys['KeyW'] || this.keys['ArrowUp']; }
    isDown() { return this.keys['KeyS'] || this.keys['ArrowDown']; }
    isLeft() { return this.keys['KeyA'] || this.keys['ArrowLeft']; }
    isRight() { return this.keys['KeyD'] || this.keys['ArrowRight']; }
    
    // Стрелять можно левым кликом ИЛИ пробелом
    isShooting() { return this.shooting || this.keys['Space']; }
    
    getMouseX() { return this.mouseX; }
    getMouseY() { return this.mouseY; }
}
