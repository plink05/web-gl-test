export class AttributeManager {
    constructor(gl) {
        this.gl = gl;
        this.attributes = {};
        this.defaultConfig = {
            type: WebGL2RenderingContext.FLOAT,
            normalize: false,
            stride: 0,
            offset: 0,
            usage: WebGL2RenderingContext.STATIC_DRAW
        };
    }

    /**
     * Create a new attribute with buffer data
     */
    createAttribute(name, data, config) {
        const gl = this.gl;
        const buffer = gl.createBuffer();

        // Determine the type of data and create appropriate buffer
        let typedData;
        if (data instanceof Float32Array) {
            typedData = data;
        } else if (data instanceof Uint16Array) {
            typedData = data;
        } else if (Array.isArray(data)) {
            typedData = new Float32Array(data);
        } else {
            throw new Error(`Unsupported data type for attribute ${name}`);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, typedData, config.usage || this.defaultConfig.usage);

        this.attributes[name] = {
            ...this.defaultConfig,
            ...config,
            buffer,
            data: typedData
        };

        return this;
    }

    /**
     * Create multiple attributes at once
     */
    createAttributes(attributesData) {
        Object.entries(attributesData).forEach(([name, { data, ...config }]) => {
            this.createAttribute(name, data, config);
        });
        return this;
    }

    /**
     * Update data for an existing attribute
     */
    updateAttribute(name, data, usage = WebGL2RenderingContext.STATIC_DRAW) {
        const gl = this.gl;
        const attribute = this.attributes[name];

        if (!attribute) {
            throw new Error(`Attribute ${name} does not exist`);
        }

        let typedData;
        if (data instanceof Float32Array || data instanceof Uint16Array) {
            typedData = data;
        } else if (Array.isArray(data)) {
            typedData = new Float32Array(data);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, typedData, usage);
        attribute.data = typedData;

        return this;
    }

    /**
     * Setup attributes for rendering
     */
    setupAttributes(program) {
        const gl = this.gl;

        Object.entries(this.attributes).forEach(([name, config]) => {
            const location = gl.getAttribLocation(program, name);
            if (location === -1) {
                console.warn(`Attribute ${name} not found in shader program`);
                return;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, config.buffer);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(
                location,
                config.numComponents,
                config.type,
                config.normalize,
                config.stride,
                config.offset
            );
        });
    }

    /**
     * Get number of vertices from the first attribute
     */
    getNumVertices() {
        const firstAttribute = Object.values(this.attributes)[0];
        if (!firstAttribute) return 0;

        return firstAttribute.data.length / firstAttribute.numComponents;
    }

    /**
     * Create and set up an index buffer
     */
    createIndexBuffer(data) {
        const gl = this.gl;
        const indexBuffer = gl.createBuffer();

        let typedData;
        if (data instanceof Uint16Array) {
            typedData = data;
        } else if (Array.isArray(data)) {
            typedData = new Uint16Array(data);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typedData, gl.STATIC_DRAW);

        this.indexBuffer = {
            buffer: indexBuffer,
            data: typedData,
            numElements: typedData.length
        };

        return this;
    }

    /**
     * Draw the attributes
     */
    draw(program, mode = WebGL2RenderingContext.TRIANGLES) {
        const gl = this.gl;

        // Setup attributes
        this.setupAttributes(program);

        // Draw based on whether we have an index buffer
        if (this.indexBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer.buffer);
            gl.drawElements(mode, this.indexBuffer.numElements, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(mode, 0, this.getNumVertices());
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        const gl = this.gl;

        // Delete attribute buffers
        Object.values(this.attributes).forEach(attribute => {
            gl.deleteBuffer(attribute.buffer);
        });

        // Delete index buffer if it exists
        if (this.indexBuffer) {
            gl.deleteBuffer(this.indexBuffer.buffer);
        }

        this.attributes = {};
        this.indexBuffer = null;
    }
}
