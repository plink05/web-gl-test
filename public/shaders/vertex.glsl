attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

// uniform vec3 u_offset;
uniform mat4 u_matrix;
uniform mat4 u_worldMatrix;

uniform vec3 u_worldLightPosition;
uniform mat4 u_worldInverseTranspose;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;

varying vec2 v_texcoord;

void main() {
    // vec4 position = a_position;

    // v_normal = mat3(u_worldInverseTranspose) * a_normal;
    // vec3 surfaceWorldPosition = (u_worldMatrix * a_position).xyz;

    // v_surfaceToLight = u_worldLightPosition - surfaceWorldPosition;

    gl_Position = u_matrix * a_position;
    v_texcoord = a_texcoord;
    // v_normal = a_normal;
}
