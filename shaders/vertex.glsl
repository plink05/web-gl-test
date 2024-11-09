attribute vec4 a_position;

uniform vec3 u_offset;

void main() {
    // vec4 position = a_position;
    vec3 position = u_offset + a_position.xyz;
    gl_Position = vec4(position, 1.0);
}
