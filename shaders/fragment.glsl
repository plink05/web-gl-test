// fragment.glsl
precision mediump float;

uniform vec4 u_color;
varying vec3 v_normal;

varying vec3 v_surfaceToLight;

void main() {
    // vec3 random = vec3(1.0, 1.0, 1.0);
    vec3 normal = normalize(v_normal);

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    float light = dot(normal, surfaceToLightDirection);
    //float x = dot(v_normal, random);
    gl_FragColor = u_color;
    gl_FragColor.rgb *= light;
}
