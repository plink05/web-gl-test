// fragment.glsl
precision mediump float;
uniform float uTime;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;

void main() {
    // Create smooth cycling colors based on time
    // vec3 color = vec3(
    //         sin(uTime) * 0.5 + 0.5,
    //         sin(uTime + 2.094) * 0.5 + 0.5, // 2.094 = 2π/3
    //         sin(uTime + 4.189) * 0.5 + 0.5 // 4.189 = 4π/3
    //     );

    vec3 normal = normalize(v_normal);

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    float light = dot(normal, surfaceToLightDirection);
    float specular = 0.0;
    if (light > 0.0) {
        specular = pow(dot(normal, halfVector), u_shininess);
    }

    gl_FragColor = u_color;

    gl_FragColor.rgb *= light;

    // Just add in the specular
    gl_FragColor.rgb += specular;

    // gl_FragColor = vec4(color, 1.0);
}
