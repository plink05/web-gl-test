export class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frames = 0;
        this.lastTime = performance.now();
        this.element = document.getElementById('fps');
    }

    update() {
        this.frames++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.lastTime = currentTime;
            this.element.textContent = `FPS: ${this.fps}`;
        }
    }
}
