attribute vec4 a_position;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;
uniform vec3 u_lightWorldPosition;
uniform vec3 u_worldViewPosition;
uniform mat4 u_world;

attribute vec3 a_normals;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
    gl_Position = u_worldViewProjection * a_position;

    // orient the normals and pass to the fragment shader
    v_normal = mat3(u_worldInverseTranspose) * a_normals;

    // compute the world position of the surface
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

    // compute the vecotr of the surface to the light
    // and pass it to the fragment shader
    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    // compute the vector of the surface to the view/camera
    // and pass it to the fragment shader
    v_surfaceToView = u_worldViewPosition - surfaceWorldPosition;
}
