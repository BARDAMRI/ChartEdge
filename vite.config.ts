import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'), // entry point for the library
            name: 'ChartEdge',
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'cjs'], // output formats
        },
        rollupOptions: {
            external: ['react', 'react-dom'], // files to exclude from the bundle
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    },
});