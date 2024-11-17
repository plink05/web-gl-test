// fragment.glsl
precision mediump float;

uniform vec4 u_color;
varying vec3 v_normal;

varying vec3 v_surfaceToLight;
varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
    // vec3 random = vec3(1.0, 1.0, 1.0);
    // vec3 normal = normalize(v_normal);

    // vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    // float light = dot(normal, surfaceToLightDirection);
    gl_FragColor = texture2D(u_texture, v_texcoord);
    gl_FragColor *= 10.0;
    // gl_FragColor = vec4(v_texcoord.x, v_texcoord.y, 1.0, 1.0); // texture2D(u_texture, v_texcoord);
    // gl_FragColor = u_color;
    // gl_FragColor.rgb *= light;
}
