// Represents a reusable 3D object template (cube, sphere, etc.)
import { UniformManager } from "./uniforms.js";
import { AttributeManager } from "./attribs.js";
class Mesh {
    constructor(gl, attributes) {
        this.gl = gl;
        this.attributeManager = new AttributeManager(gl);
        this.attributeManager.createAttributes(attributes);
    }

    draw(program) {
        this.attributeManager.setupAttributes(program);
        this.attributeManager.draw(program);
    }
}

// An instance of a mesh with its own uniforms
class MeshInstance {
    constructor(mesh, uniforms = {}) {
        this.mesh = mesh;
        this.uniforms = uniforms;
    }

    setUniforms(uniforms) {
        this.uniforms = uniforms;
        return this;
    }
}

// Manages the complete scene
export class Scene {
    constructor(gl) {
        this.gl = gl;
        this.instances = [];
        this.uniformManager = new UniformManager(gl);
        this.meshes = new Map(); // Store mesh templates
    }

    // Create and store a reusable mesh template
    createMesh(name, attributes) {
        const mesh = new Mesh(this.gl, attributes);
        this.meshes.set(name, mesh);
        return mesh;
    }

    // Create an instance of a mesh with specific uniforms
    createInstance(meshName, uniforms = {}) {
        const mesh = this.meshes.get(meshName);
        if (!mesh) {
            throw new Error(`Mesh "${meshName}" not found`);
        }

        const instance = new MeshInstance(mesh, uniforms);
        this.instances.push(instance);
        return instance;
    }

    // Draw all instances
    draw(program) {
        this.instances.forEach(instance => {
            // Update uniforms for this instance
            console.log(instance);
            this.uniformManager.setUniforms(instance.uniforms);
            this.uniformManager.updateProgram(program);

            // Draw the mesh with current uniforms
            instance.mesh.draw(program);
        });
    }
}
