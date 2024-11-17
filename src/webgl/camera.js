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
        this.baseSpeed = 10.0;      // Units per second
        this.minSpeed = 0.1;       // Minimum speed when very close to objects
        this.maxSpeed = 100.0;      // Maximum speed when far from objects
        this.logBase = 2;          // Controls how quickly speed changes with distance
        this.accelerationRate = 10.0;
        this.mouseSensitivity = 0.002;

        // Collision detection
        this.maxRayDistance = 100;  // Maximum distance to check for objects
        this.minDistance = 1.0;     // Minimum distance to maintain from objects


        // Movement state
        this.keys = new Set();
        this.keyHoldTime = {
            keyw: 0,
            keys: 0,
            keya: 0,
            keyd: 0
        };
        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Movement vectors
        this.forward = vec3.create();
        this.right = vec3.create();

        this.setupControls();
        this.updateVectors();
    }
    // raycast(objects) {
    //     // Simple ray-object intersection
    //     // objects should be an array of { position: vec3, radius: number }
    //     let minDist = this.maxRayDistance;

    //     for (const obj of objects) {
    //         // Calculate vector from camera to object
    //         const toObject = vec3.create();
    //         vec3.subtract(toObject, obj.position, this.position);

    //         // Project onto forward vector to get distance along view direction
    //         const dot = vec3.dot(toObject, this.forward);

    //         // Only consider objects in front of camera
    //         if (dot > 0) {
    //             // Calculate closest point on ray to object center
    //             const projection = vec3.scale(vec3.create(), this.forward, dot);
    //             const perpendicular = vec3.subtract(vec3.create(), toObject, projection);
    //             const distance = vec3.length(perpendicular);

    //             // If within object's radius, calculate actual intersection distance
    //             if (distance < obj.radius) {
    //                 const intersectDist = dot - Math.sqrt(obj.radius * obj.radius - distance * distance);
    //                 minDist = Math.min(minDist, Math.max(0, intersectDist));
    //             }
    //         }
    //     }

    //     return minDist;
    // }

    // Calculate movement speed based on distance to nearest object
    calculateSpeed(key) {
        // Use logarithmic scaling
        //
        if (!this.keys.has(key)) return 0;

        this.keyHoldTime[key]++;

        // Calculate logarithmic speed increase
        const speed = this.baseSpeed * Math.min(
            Math.log(this.keyHoldTime[key] * this.accelerationRate + 1) / Math.log(10),
            this.maxSpeed / this.baseSpeed
        );

        return Math.min(speed, this.maxSpeed);
    }


    // Override setTarget to update yaw and pitch
    setTarget(x, y, z) {
        super.setTarget(x, y, z);

        // Calculate direction vector from position to target
        const direction = vec3.create();
        vec3.subtract(direction, this.target, this.position);
        vec3.normalize(direction, direction);

        // Calculate yaw and pitch from direction vector
        this.pitch = Math.asin(direction[1]);
        this.yaw = Math.atan2(direction[2], direction[0]);

        this.updateVectors();
        return this;
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.code.toLowerCase());
        });

        document.addEventListener('keyup', (e) => {
            const key = e.code.toLowerCase();
            this.keys.delete(key);
            this.keyHoldTime[key] = 0;  // Reset hold time when key is released
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
        // document.addEventListener('click', () => {
        //     document.body.requestPointerLock();
        // });

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
        var movement = vec3.create();
        // Forward/Backward
        if (this.keys.has('keyw')) {
            const forwardSpeed = this.calculateSpeed('keyw') * deltaTime;

            movement = vec3.scaleAndAdd(movement, movement, this.forward, forwardSpeed)
        };
        if (this.keys.has('keys')) {
            const backwardSpeed = this.calculateSpeed('keys') * deltaTime;

            movement = vec3.scaleAndAdd(movement, movement, this.forward, -backwardSpeed);
        }

        // Strafe Left/Right
        if (this.keys.has('keyd')) {
            const rightSpeed = this.calculateSpeed('keyd') * deltaTime;
            movement = vec3.scaleAndAdd(movement, movement, this.right, rightSpeed);
        }
        if (this.keys.has('keya')) {
            const leftSpeed = this.calculateSpeed('keya') * deltaTime;

            movement = vec3.scaleAndAdd(movement, movement, this.right, -leftSpeed);
        }
        const strafeAmount = this.baseSpeed * deltaTime;
        // Up/Down
        if (this.keys.has('space')) movement[1] += strafeAmount;
        if (this.keys.has('shiftleft')) movement[1] -= strafeAmount;

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
