// fragment.glsl
precision mediump float;
uniform float uTime;

void main() {
    // Create smooth cycling colors based on time

    vec3 color = vec3(
            sin(uTime) * 0.5 + 0.5,
            sin(uTime + 2.094) * 0.5 + 0.5, // 2.094 = 2π/3
            sin(uTime + 4.189) * 0.5 + 0.5 // 4.189 = 4π/3
        );
    gl_FragColor = vec4(color, 1.0);
}
