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

function findMinMax(array) {
    let min = array[0];
    let max = array[0];

    for (let i = 1; i < array.length; i++) {
        if (array[i] < min) min = array[i];
        if (array[i] > max) max = array[i];
    }

    return { min, max };
}

function processData(textureInfo) {
    const data = textureInfo.data;
    const width = textureInfo.width;
    const height = textureInfo.height;


    if (data[0].length !== width * height ||
        data[1].length !== width * height ||
        data[2].length !== width * height) {
        throw new Error('Data size mismatch');
    }

    const bufferSize = width * height * 3;

    const normalizedData = new Uint8Array(bufferSize);

    const mins = [
        findMinMax(data[0]).min,
        findMinMax(data[1]).min,
        findMinMax(data[2]).min,
    ];
    const maxs = [
        findMinMax(data[0]).max,
        findMinMax(data[1]).max,
        findMinMax(data[2]).max,
    ];
    // for (let i = 0; i < width * height; i++) {
    //     normalizedData[i * 3] = data[0][i] >> 8;     // Convert 16-bit to 8-bit
    //     normalizedData[i * 3 + 1] = data[1][i] >> 8;
    //     normalizedData[i * 3 + 2] = data[2][i] >> 8;
    // }
    //
    //
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const outIndex = i * 3;

            // Make sure we don't go past our data bounds
            if (i < width * height) {
                normalizedData[outIndex] = data[0][i] >> 8;
                normalizedData[outIndex + 1] = data[1][i] >> 8;
                normalizedData[outIndex + 2] = data[2][i] >> 8;
            }
        }
    }

    return normalizedData;
}

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

    // var uniformSetters = createUniformSetters(gl, shaderProgram);
    // var attribSetters = createAttributeSetters(gl, shaderProgram);

    var controlManager = setupHandlers();
    var scene = setupScene(gl, controlManager);

    // var uniformManager = setupUniformManager(gl, controlManager);

    // var attributeManager = setupAttributeManager(gl);
    //

    var textureInfo = await loadGeoTIFF("/sample.tif");
    var texture = gl.createTexture();
    // var { data, width, height } = textureInfo;
    const normalizedData = processData(textureInfo);



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
        var texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.RGB,       // internal format
            1001,              // width
            1001,             // height
            0,                  // border
            gl.RGB,       // format
            gl.UNSIGNED_BYTE,   // type
            normalizedData      // data
        );

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
