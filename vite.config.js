export default {
	assetsInclude: ['**/*.glsl', '**/*.tif'], // This tells Vite to serve .glsl files as assets
	server: {
		watch: {
			usePolling: true,
			include: ['**/*.glsl', '**/*.tif'] // Explicitly include glsl files in watch
		}
	}
}
