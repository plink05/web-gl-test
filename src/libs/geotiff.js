import * as GeoTIFF from 'geotiff';

export async function loadGeoTIFF(url) {
    try {
        console.log(url);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();

        // Read raster data
        const data = await image.readRasters();
        const width = image.getWidth();
        const height = image.getHeight();
        console.log(data);

        console.log({
            width: image.getWidth(),
            height: image.getHeight(),
            samplesPerPixel: image.getSamplesPerPixel(),
            bitsPerSample: image.getBitsPerSample(),
        });
        return { data, width, height };
    } catch (error) {
        console.error('Error loading GeoTiff:', error);
        throw error;
    };
};


export function findMinMax(array) {
    let min = array[0];
    let max = array[0];

    for (let i = 1; i < array.length; i++) {
        if (array[i] < min) min = array[i];
        if (array[i] > max) max = array[i];
    }

    return { min, max };
}

export function processData(textureInfo) {
    const data = textureInfo.data;
    const width = textureInfo.width;
    const height = textureInfo.height;


    if (data[0].length !== width * height ||
        data[1].length !== width * height ||
        data[2].length !== width * height) {
        throw new Error('Data size mismatch');
    }

    const bufferSize = width * height * 3;

    const normalizedData = new Uint8Array(bufferSize);

    const mins = [
        findMinMax(data[0]).min,
        findMinMax(data[1]).min,
        findMinMax(data[2]).min,
    ];
    const maxs = [
        findMinMax(data[0]).max,
        findMinMax(data[1]).max,
        findMinMax(data[2]).max,
    ];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const outIndex = i * 3;

            // Make sure we don't go past our data bounds
            if (i < width * height) {
                normalizedData[outIndex] = data[0][i] >> 8;
                normalizedData[outIndex + 1] = data[1][i] >> 8;
                normalizedData[outIndex + 2] = data[2][i] >> 8;
            }
        }
    }

    return normalizedData;
}
