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
