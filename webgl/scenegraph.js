class Node {
    constructor(name = 'unnamed') {
        this.name = name;
        this.children = [];
        this.parent = null;
        this.localMatrix = mat4.create();
        this.worldMatrix = mat4.create();
        this.position = vec3.create();
        this.rotation = quat.create();
        this.scale = vec3.fromValues(1, 1, 1);
        this.meshes = [];
        this.enabled = true;
        this._dirty = true;
    }

    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }

    setPosition(x, y, z) {
        vec3.set(this.position, x, y, z);
        this._dirty = true;
    }

    setRotationFromEuler(x, y, z) {
        quat.fromEuler(this.rotation, x, y, z);
        this._dirty = true;
    }

    setScale(x, y, z) {
        vec3.set(this.scale, x, y, z);
        this._dirty = true;
    }

    addMesh(mesh) {
        this.meshes.push(mesh);
    }

    removeMesh(mesh) {
        const index = this.meshes.indexOf(mesh);
        if (index !== -1) {
            this.meshes.splice(index, 1);
        }
    }

    updateLocalMatrix() {
        mat4.fromRotationTranslationScale(
            this.localMatrix,
            this.rotation,
            this.position,
            this.scale
        );
    }

    updateWorldMatrix(parentWorldMatrix = null) {
        if (this._dirty) {
            this.updateLocalMatrix();
        }

        if (parentWorldMatrix) {
            mat4.multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix);
        } else {
            mat4.copy(this.worldMatrix, this.localMatrix);
        }

        this.children.forEach(child => {
            child.updateWorldMatrix(this.worldMatrix);
        });

        this._dirty = false;
    }

    traverse(callback) {
        callback(this);
        this.children.forEach(child => child.traverse(callback));
    }

    find(predicate) {
        if (predicate(this)) {
            return this;
        }
        for (const child of this.children) {
            const result = child.find(predicate);
            if (result) {
                return result;
            }
        }
        return null;
    }

    findByName(name) {
        return this.find(node => node.name === name);
    }
}

class SceneGraph {
    constructor() {
        this.root = new Node('root');
        this.shaderPrograms = new Map();
        this.cameras = new Map();
        this.lights = new Map();
    }

    update() {
        this.root.updateWorldMatrix();
    }

    render(gl, activeCamera) {
        if (!activeCamera) {
            throw new Error('No active camera set for rendering');
        }

        // Update matrices before rendering
        this.update();

        // Get camera matrices
        const viewMatrix = activeCamera.viewMatrix;
        const projectionMatrix = activeCamera.projectionMatrix;

        // Render traversal
        this.root.traverse(node => {
            if (!node.enabled || node.meshes.length === 0) return;

            node.meshes.forEach(mesh => {
                const shader = this.shaderPrograms.get(mesh.shader);
                if (!shader) return;

                gl.useProgram(shader.program);

                // Set common uniforms
                shader.setUniform('u_worldMatrix', node.worldMatrix);
                shader.setUniform('u_viewMatrix', viewMatrix);
                shader.setUniform('u_projectionMatrix', projectionMatrix);

                // Set light uniforms if available
                this.lights.forEach(light => {
                    light.setUniforms(shader);
                });

                // Render the mesh
                mesh.render(gl, shader);
            });
        });
    }

    addShaderProgram(name, program) {
        this.shaderPrograms.set(name, program);
    }

    addCamera(name, camera) {
        this.cameras.set(name, camera);
    }

    addLight(name, light) {
        this.lights.set(name, light);
    }

    createNode(name) {
        return new Node(name);
    }
}

// Example mesh class interface (implementation depends on your rendering setup)
class Mesh {
    constructor(geometry, material, shader = 'default') {
        this.geometry = geometry;
        this.material = material;
        this.shader = shader;
    }

    render(gl, shader) {
        // Set material uniforms
        this.material.setUniforms(gl, shader);

        // Bind geometry buffers
        this.geometry.bind(gl);

        // Draw
        gl.drawElements(
            this.geometry.drawMode,
            this.geometry.indexCount,
            this.geometry.indexType,
            0
        );
    }
}
