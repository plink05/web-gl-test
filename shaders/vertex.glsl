attribute vec4 a_position;

// uniform vec3 u_offset;
uniform mat4 u_matrix;

void main() {
    // vec4 position = a_position;
    gl_Position = u_matrix * a_position;
}
