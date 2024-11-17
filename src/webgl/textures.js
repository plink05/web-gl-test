import * as coreGeoTIFF from "../libs/geotiff.js";
export class TextureManager {
    constructor(gl) {
        this.gl = gl;
        this.textures = new Map();
        this.loadingTextures = new Map();
        this.defaultTexture = this.createDefaultTexture();
    }

    // Create a simple default texture (pink/black checkerboard)
    createDefaultTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const pixels = new Uint8Array([
            255, 0, 255, 255, 0, 0, 0, 255,
            0, 0, 0, 255, 255, 0, 255, 255
        ]);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            2, 2,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        return texture;
    }

    // Load a texture from a URL
    async loadGeotiff(url) {
        const gl = this.gl;

        // Return existing texture if already loaded
        if (this.textures.has(url)) {
            return this.textures.get(url);
        }

        // Return promise if texture is currently loading
        if (this.loadingTextures.has(url)) {
            return this.loadingTextures.get(url);
        }

        // Create new loading promise
        const loadingPromise = (async () => {
            try {
                var textureInfo = await coreGeoTIFF.loadGeoTIFF(url);
                const normalizedData = coreGeoTIFF.processData(textureInfo);

                var texture = gl.createTexture();

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                gl.texImage2D(
                    gl.TEXTURE_2D,      // target
                    0,                  // mip level
                    gl.RGB,       // internal format
                    textureInfo.width,              // width
                    textureInfo.height,             // height
                    0,                  // border
                    gl.RGB,       // format
                    gl.UNSIGNED_BYTE,   // type
                    normalizedData      // data
                );
                this.textures.set(url, texture);
                return texture;
            } catch (error) {
                throw error;
            }
        })();

        this.loadingTextures.set(url, loadingPromise);
        return loadingPromise;
    }

    // Utility function to check if a number is a power of 2
    isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    // Get a texture by URL (returns default texture if not loaded)
    getTexture(url) {
        return this.textures.get(url) || this.defaultTexture;
    }

    // Delete a specific texture
    deleteTexture(url) {
        if (this.textures.has(url)) {
            this.gl.deleteTexture(this.textures.get(url));
            this.textures.delete(url);
        }
    }

    // Delete all textures
    deleteAllTextures() {
        for (const texture of this.textures.values()) {
            this.gl.deleteTexture(texture);
        }
        this.textures.clear();
        this.loadingTextures.clear();
    }

    // Bind a texture to a specific texture unit
    bindTexture(url, textureUnit = 0) {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.getTexture(url));
        return textureUnit;
    }
}
