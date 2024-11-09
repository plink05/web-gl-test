import { vec3, mat4 } from "../math/helpers.js";
import { m4 } from "../math/utils.js";
export class Camera {
    constructor() {
        this.position = vec3.create();
        this.target = vec3.create();
        this.up = vec3.fromValues(0, 0, 1);

        this.viewMatrix = m4.identity();
        this.projectionMatrix = mat4.create();
    }

    updateViewMatrix() {
        this.viewMatrix = m4.lookAt(this.position, this.target, this.up);
        return this.viewMatrix;
    }
}

export class PerspectiveCamera extends Camera {
    constructor(fovDegrees = 45, aspect = 1, near = 0.1, far = 1000) {
        super();

        this.fov = fovDegrees * Math.PI / 180;  // convert to radians
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.projectionMatrix = mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.near, this.far);
        console.log(this.projectionMatrix);
        return this.projectionMatrix;
    }

    setPosition(x, y, z) {
        this.position = vec3.set(this.position, x, y, z);
        this.updateViewMatrix();
        return this;
    }

    setTarget(x, y, z) {
        this.target = vec3.set(this.target, x, y, z);
        this.updateViewMatrix();
        return this;
    }

    setUp(x, y, z) {
        this.up = vec3.set(this.up, x, y, z);
        this.up = vec3.normalize(this.up, this.up);
        this.updateViewMatrix();
        return this;
    }

    setAspect(aspect) {
        this.aspect = aspect;
        this.updateProjectionMatrix();
        return this;
    }

    setFov(fovDegrees) {
        this.fov = fovDegrees * Math.PI / 180;
        this.updateProjectionMatrix();
        return this;
    }

    lookAt(x, y, z) {
        this.target = vec3.set(this.target, x, y, z);
        this.updateViewMatrix();
        return this;
    }
}

export class FirstPersonCamera extends PerspectiveCamera {
    constructor(fovDegrees = 45, aspect = 1, near = 0.1, far = 1000) {
        super(fovDegrees, aspect, near, far);

        // Camera orientation
        this.yaw = -Math.PI / 2;   // Horizontal rotation (around Y axis)
        this.pitch = 0;            // Vertical rotation (around X axis)

        // Movement settings
        this.moveSpeed = 5.0;      // Units per second
        this.mouseSensitivity = 0.002;

        // Movement state
        this.keys = new Set();
        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Movement vectors
        this.forward = vec3.create();
        this.right = vec3.create();

        this.setupControls();
        this.updateVectors();
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.code.toLowerCase());
        });

        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.code.toLowerCase());
        });

        // Mouse controls
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {  // Left click
                this.mouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {  // Left click
                this.mouseDown = false;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.mouseDown) return;

            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            this.yaw += deltaX * this.mouseSensitivity;
            this.pitch -= deltaY * this.mouseSensitivity;

            // Clamp pitch to avoid camera flipping
            this.pitch = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2 - 0.001, this.pitch));

            this.updateVectors();

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        // Optional: Handle pointer lock for smoother mouse control
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement) {
                document.addEventListener('mousemove', this.handleLockedMouseMove);
            } else {
                document.removeEventListener('mousemove', this.handleLockedMouseMove);
                this.mouseDown = false;
            }
        });
    }

    handleLockedMouseMove = (e) => {
        this.yaw += e.movementX * this.mouseSensitivity;
        this.pitch -= e.movementY * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2 - 0.001, this.pitch));
        this.updateVectors();
    }

    updateVectors() {
        // Calculate forward vector
        this.forward[0] = Math.cos(this.pitch) * Math.cos(this.yaw);
        this.forward[1] = Math.sin(this.pitch);
        this.forward[2] = Math.cos(this.pitch) * Math.sin(this.yaw);
        this.forward = vec3.normalize(this.forward, this.forward);

        // Calculate right vector
        this.right = vec3.cross(this.right, this.forward, [0, 1, 0]);
        this.right = vec3.normalize(this.right, this.right);

        // Update camera target
        this.target = vec3.add(this.target, this.position, this.forward);

        this.updateViewMatrix();
    }

    update(deltaTime) {
        const moveAmount = this.moveSpeed * deltaTime;
        const movement = vec3.create();

        // Forward/Backward
        if (this.keys.has('keyw')) vec3.scaleAndAdd(movement, movement, this.forward, moveAmount);
        if (this.keys.has('keys')) vec3.scaleAndAdd(movement, movement, this.forward, -moveAmount);

        // Strafe Left/Right
        if (this.keys.has('keyd')) vec3.scaleAndAdd(movement, movement, this.right, moveAmount);
        if (this.keys.has('keya')) vec3.scaleAndAdd(movement, movement, this.right, -moveAmount);

        // Up/Down
        if (this.keys.has('space')) movement[1] += moveAmount;
        if (this.keys.has('shiftleft')) movement[1] -= moveAmount;

        // Apply movement
        this.position = vec3.add(this.position, this.position, movement);
        this.target = vec3.add(this.target, this.position, this.forward);

        this.updateViewMatrix();
    }

    setMovementSpeed(speed) {
        this.moveSpeed = speed;
        return this;
    }

    setMouseSensitivity(sensitivity) {
        this.mouseSensitivity = sensitivity;
        return this;
    }
}
