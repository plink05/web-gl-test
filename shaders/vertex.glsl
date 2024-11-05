attribute vec4 a_position;
uniform mat4 u_matrix;
attribute vec4 a_color;

uniform float u_fudgeFactor;

varying vec4 v_color;

void main() {
    gl_Position = u_matrix * a_position;

    v_color = a_color;
}
