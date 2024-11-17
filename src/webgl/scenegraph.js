import { mat4, vec3, quat } from "../math/helpers.js";
import { m4 } from "../math/utils.js";

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
        this.instances = [];
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
        this.position = vec3.set(this.position, x, y, z);
        this._dirty = true;
    }

    setRotationFromEuler(x, y, z) {
        this.rotation = quat.fromEuler(this.rotation, x, y, z);
        this._dirty = true;
    }

    setScale(x, y, z) {
        this.scale = vec3.set(this.scale, x, y, z);
        this._dirty = true;
    }

    addInstance(instance) {
        this.instances.push(instance);
    }

    removeInstance(instance) {
        const index = this.instances.indexOf(instance);
        if (index !== -1) {
            this.instances.splice(index, 1);
        }
    }

    updateLocalMatrix() {
        this.localMatrix = mat4.fromRotationTranslationScale(
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
            this.worldMatrix = mat4.multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix);
        } else {
            this.worldMatrix = mat4.copy(this.worldMatrix, this.localMatrix);
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

export class SceneGraph {
    constructor() {
        this.root = new Node('root');
        this.shaderPrograms = new Map();
        this.cameras = new Map();
        this.lights = [];
    }

    update() {
        this.root.updateWorldMatrix();
    }

    render(activeCamera, uniformManager, textureManager) {
        if (!activeCamera) {
            throw new Error('No active camera set for rendering');
        }

        // Update matrices before rendering
        this.update();

        // Get camera matrices
        // console.log(activeCamera.viewMatrix);
        // console.log(activeCamera.viewMatrix);
        const viewMatrix = m4.inverse(activeCamera.viewMatrix);
        // console.log(viewMatrix);
        //console.log(viewMatrix);
        const projectionMatrix = activeCamera.projectionMatrix;

        // Render traversal
        this.root.traverse(node => {
            if (!node.enabled || node.instances.length === 0) return;

            node.instances.forEach(instance => {
                const shader = this.shaderPrograms.get(instance.shader);
                if (!shader) return;

                // gl.useProgram(shader);
                //
                const viewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
                const matrix = mat4.multiply(mat4.create(), viewProjectionMatrix, node.worldMatrix);

                // Merge common uniforms with out specific ones
                const merged = this.lights.reduce((acc, obj) => {
                    return { ...acc, ...obj.getUniforms(this.root.findByName(obj.nodeKey)) };
                }, {});
                // console.log(merged);
                const mergedUniforms = {
                    ...instance.uniforms, ... {
                        u_matrix: matrix,
                        u_worldMatrix: node.worldMatrix,
                        u_worldInverseTranspose: m4.transpose(m4.inverse(node.worldMatrix)),
                        u_viewMatrix: viewMatrix,
                        u_projectionMatrix: projectionMatrix,
                        u_viewPositon: [viewMatrix[12], viewMatrix[13], viewMatrix[14]],
                    }
                };
                const mergedUniformss = {
                    ...mergedUniforms, ...merged
                }
                // console.log(mergedUniforms);
                //
                // TODO(plink): allow switching textures based on materials
                uniformManager.setUniforms(mergedUniformss);
                uniformManager.updateProgram(shader);

                // Set light uniforms if available
                // node.lights.forEach(light => {
                //     light.setUniforms(uniformManager, this.root.findByName(light.nodeKey));
                // });
                // console.log(uniformManager.uniforms);

                // Render the mesh
                instance.mesh.draw(shader);
            });
        });
    }

    addShaderProgram(name, program) {
        this.shaderPrograms.set(name, program);
    }

    addCamera(name, camera) {
        this.cameras.set(name, camera);
    }

    // addLight(name, light) {
    //     this.lights.set(name, light);
    // }

    createNode(name) {
        return new Node(name);
    }
}

// Example mesh class interface (implementation depends on your rendering setup)
// class Mesh {
//     constructor(geometry, material, shader = 'default') {
//         this.geometry = geometry;
//         this.material = material;
//         this.shader = shader;
//     }
// 
//     render(gl, shader) {
//         // Set material uniforms
//         this.material.setUniforms(gl, shader);
// 
//         // Bind geometry buffers
//         this.geometry.bind(gl);
// 
//         // Draw
//         gl.drawElements(
//             this.geometry.drawMode,
//             this.geometry.indexCount,
//             this.geometry.indexType,
//             0
//         );
//     }
// }
