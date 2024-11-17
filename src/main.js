import { normalize, getNormals, setColors, degToRad, m4, getXYRotation, setRectangle } from "./math/utils.js";

import { loadShader, initShaderProgram, compileShader } from "./webgl/mod.js";
import { FPSCounter } from "./app/fps.js";
import { UniformManager } from "./webgl/uniforms.js";
import { AttributeManager } from "./webgl/attribs.js";
import { ControlManager } from "./app/handleManager.js";
import { createUniformSetters, createAttributeSetters, setAttributes, setBuffersAndAttributes } from "./webgl/utils.js";
import { get3DGeometry } from "./math/utils.js";
import { Scene } from "./webgl/scene.js";

import { loadGeoTIFF } from "./libs/geotiff.js";


export async function main() {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");

    if (gl === null) {
        console.error("Unable to initialize WebGL");
        return;
    }



    // Load shaders
    const vsSource = await loadShader('/shaders/vertex.glsl');
    const fsSource = await loadShader('/shaders/fragment.glsl');

    // Initialize shader program
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    var controlManager = setupHandlers();
    var scene = setupScene(gl, controlManager);


    // Initialize FPS counter
    const fpsCounter = new FPSCounter();

    render();

    // Animation function
    function render(time) {

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(shaderProgram);
        scene.addShaderProgram("default", shaderProgram);

        scene.draw(time);
        // TODO(plink): figure this bit out 
        // setBuffersAndAttributes(attribSetters, attributeManager.bufferInfo());
        // uniformManager.updateProgram(shaderProgram);
        // attributeManager.draw(shaderProgram);


        // Update FPS counter
        fpsCounter.update();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

function setupScene(gl, controlManager) {
    const scene = new Scene(gl);

    scene.createCamera(gl, 30, 0.1, 1000);
    scene.addLights(gl, "root", [100, 100, 100]);

    const child = scene.insertNode("child", "root");

    child.setPosition(100, 0, 1);
    child.setRotationFromEuler(0, 0, Math.PI / 2);

    const gchild = scene.insertNode("grandchild", "child");

    gchild.setRotationFromEuler(0, 0, Math.PI / 2);

    scene.createMesh('quad', {
        a_position: {
            data: new Float32Array([
                -100, -100, 0,
                100, -100, 0,
                -100, 100, 0,
                -100, 100, 0,
                100, -100, 0,
                100, 100, 0
            ]), numComponents: 3
        },
        a_texcoord: {
            data: new Float32Array([
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1,
            ]), numComponents: 2
        },
        // a_normal: { data: getNormals(), numComponents: 3 },
    });

    scene.createInstance('quad', {
        u_color: [() => controlManager.getValue("x"), 0.0, 0.0, 1.0]
    });

    scene.addTexture("/sample.tif");


    // scene.createMesh('f', {
    //     a_position: { data: get3DGeometry(), numComponents: 3 },
    //     a_normal: { data: getNormals(), numComponents: 3 },
    // });

    // scene.createInstance('f', {
    //     u_color: [() => controlManager.getValue("x"), 0.0, 0.0, 1.0]
    // });

    // scene.createInstance('f', {
    //     u_color: [() => controlManager.getValue("x"), 0.0, 1.0, 1.0]
    // }, "child");

    // scene.createInstance('f', {
    //     u_color: [0.0, () => controlManager.getValue("x"), 1.0, 1.0]
    // }, "grandchild");

    return scene;


};

function setupAttributeManager(gl) {
    var attribManager = new AttributeManager(gl);

    const points = [0.0, 0.0, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 0.0]

    attribManager.createAttributes({
        a_position: {
            data: points,//get3DGeometry(),
            numComponents: 3
        }
    });
    return attribManager;
}

function setupUniformManager(gl, controlManager) {
    var uniformManager = new UniformManager(gl);

    uniformManager.setUniforms({
        u_color: [() => controlManager.getValue("x"), 1.0, 0.0, 1.0]
        // u_xOffset: controlManager.getValue("x"),
    });
    return uniformManager;
}


function setupHandlers() {

    var controlManager = new ControlManager();
    controlManager.addControl({
        name: "x",
        controlId: "xControl",
        valueId: "xValue",
        transformers: {
            value: (val) => parseFloat(val, 10)
        }
    });

    return controlManager;
}

window.addEventListener('DOMContentLoaded', () => {
    main();
});
