import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

    build: {
        sourcemap: true,
        cssCodeSplit: true,
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'ChartEdge',
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM', 'styled-components': 'styled',
                },
            },
        },
    },
});