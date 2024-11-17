// Represents a reusable 3D object template (cube, sphere, etc.)
import { UniformManager } from "./uniforms.js";
import { AttributeManager } from "./attribs.js";
import { SceneGraph } from "./scenegraph.js";
import { PerspectiveCamera, FirstPersonCamera } from "./camera.js";
import { Lights } from "./lights.js";
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
    constructor(mesh, uniforms = {}, shader = 'default') {
        this.mesh = mesh;
        this.uniforms = uniforms;
        this.shader = shader;
    }

    setUniforms(uniforms) {
        this.uniforms = uniforms;
        return this;
    }
}

// Manages the complete scene
export class Scene {
    lastTime = 0;
    constructor(gl) {
        this.gl = gl;
        // this.instances = [];
        this.uniformManager = new UniformManager(gl);
        this.meshes = new Map(); // Store mesh templates
        this.sceneGraph = new SceneGraph();
    }

    insertNode(name, parentName) {
        const parent = this.sceneGraph.root.findByName(parentName);
        const child = this.sceneGraph.createNode(name);
        parent.addChild(child);
        return child;
    }

    getNode(name) {
        return this.sceneGraph.root.findByName(name);
    }

    // addLight(light) {

    // }

    // Create and store a reusable mesh template
    createMesh(name, attributes) {
        const mesh = new Mesh(this.gl, attributes);
        this.meshes.set(name, mesh);
        return mesh;
    }

    // Create an instance of a mesh with specific uniforms
    createInstance(meshName, uniforms = {}, parent = "root") {
        const mesh = this.meshes.get(meshName);
        if (!mesh) {
            throw new Error(`Mesh "${meshName}" not found`);
        }

        const instance = new MeshInstance(mesh, uniforms);
        const parentNode = this.sceneGraph.root.findByName(parent);
        if (!parentNode) {
            throw new Error(`No parent node named "${parent}" found`);
        }

        parentNode.instances.push(instance);
        return instance;
    }

    createCamera(gl, fovDegrees, zNear, zFar) {
        const aspect = gl.canvas.width / gl.canvas.height;
        const camera = new FirstPersonCamera(fovDegrees, aspect, zNear, zFar)
            .setPosition(0, 300, 200.0)
            .setTarget(0.0, 0.0, 0.0)
            .setMovementSpeed(5.0)
            .setMouseSensitivity(0.002);
        // camera.lookAt(0.0, 0.0, 0.0);
        this.sceneGraph.addCamera("main", camera);
    }

    addLights(gl, node, pos, color = [1.0, 1.0, 1.0]) {
        const light = new Lights(pos, color, node);
        const parentNode = this.sceneGraph.root.findByName(node);
        if (!parentNode) {
            throw new Error(`No parent node named "${node}" found`);
        }
        this.sceneGraph.lights.push(light);

    }

    addShaderProgram(shaderName, shader) {
        this.sceneGraph.addShaderProgram(shaderName, shader);
    }

    getShaderProgram(meshInstance) {
        const shaderName = meshInstance.shader;
        const shader = this.shaders.get(shaderName);
        if (!shader) {
            throw new Error(`Mesh requested invalid shader "${shaderName}`);
        }

        return shader;
    }



    // Draw all instances
    draw(time) {
        // Update uniforms for this instance
        // const shader = this.getShaderProgram(instance);

        time *= 0.001; // convert from millisecond to seconds
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        var camera = this.sceneGraph.cameras.get("main");

        camera.update(deltaTime);

        this.sceneGraph.render(camera, this.uniformManager);

        // TODO(plink): combine this with the render call
        // this.uniformManager.setUniforms(instance.uniforms);
        // this.uniformManager.updateProgram(shader);
        // Draw the mesh with current uniforms
        // instance.mesh.draw(shader);
    }
}
