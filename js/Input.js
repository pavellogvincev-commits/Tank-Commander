export class Input {
    constructor(canvas) {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }

    isForward() {
        return this.keys['KeyW'] || this.keys['ArrowUp'];
    }

    isBackward() {
        return this.keys['KeyS'] || this.keys['ArrowDown'];
    }

    isLeft() {
        return this.keys['KeyA'] || this.keys['ArrowLeft'];
    }

    isRight() {
        return this.keys['KeyD'] || this.keys['ArrowRight'];
    }
}