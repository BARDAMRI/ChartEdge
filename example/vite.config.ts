import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    build: {
        rollupOptions: {
            input: path.resolve(__dirname, 'src/main.tsx'),  // נקודת כניסה לאפליקציה
        },
    },
});