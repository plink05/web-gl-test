export class UniformManager {
    constructor(gl) {
        this.gl = gl;
        this.uniforms = {};
        this.cache = new WeakMap();

        this.uniformSetters = {
            '1f': (gl, location, value) => gl.uniform1f(location, value),
            '1i': (gl, location, value) => gl.uniform1i(location, value),
            '2f': (gl, location, value) => gl.uniform2fv(location, value),
            '3f': (gl, location, value) => gl.uniform3fv(location, value),
            '4f': (gl, location, value) => gl.uniform4fv(location, value),
            'Matrix3fv': (gl, location, value) => gl.uniformMatrix3fv(location, false, value),
            'Matrix4fv': (gl, location, value) => gl.uniformMatrix4fv(location, false, value),
        };
    }

    setUniforms(uniforms) {
        this.uniforms = uniforms;
        return this;
    }

    getUniformType(value) {
        if (typeof value === 'number') {
            return Number.isInteger(value) ? '1i' : '1f';
        }

        if (Array.isArray(value) || ArrayBuffer.isView(value)) {
            if (value.length === 16) return 'Matrix4fv';
            if (value.length === 9) return 'Matrix3fv';

            switch (value.length) {
                case 2: return '2f';
                case 3: return '3f';
                case 4: return '4f';
                default: throw new Error(`Unsupported vector length: ${value.length}`);
            }
        }

        if (value instanceof WebGLTexture || (value.texture instanceof WebGLTexture)) {
            return '1i';
        }

        throw new Error(`Unsupported uniform value type: ${value}`);
    }

    updateProgram(program) {
        const gl = this.gl;

        // Get or create location cache for this program
        if (!this.cache.has(program)) {
            this.cache.set(program, new Map());
        }
        const locationCache = this.cache.get(program);

        // Update each uniform
        Object.entries(this.uniforms).forEach(([name, value]) => {
            // Get the uniform location
            let location = locationCache.get(name);
            if (location === undefined) {
                location = gl.getUniformLocation(program, name);
                locationCache.set(name, location);
            }

            if (location === null) {
                return;
            }

            // Evaluate the value if it's a function
            const actualValue = typeof value === 'function' ? value() : value;

            // Handle array values where elements might be functions
            const resolvedValue = Array.isArray(actualValue)
                ? actualValue.map(v => typeof v === 'function' ? v() : v)
                : actualValue;


            // Set the uniform
            const type = this.getUniformType(resolvedValue);
            const setter = this.uniformSetters[type];

            try {
                setter(gl, location, resolvedValue);
            } catch (error) {
                console.error(`Error setting uniform ${name}:`, error);
            }
        });
    }
}
