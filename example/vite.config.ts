import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..');

/** Prebuilt library entry points (run `npm run build` at repo root). Resolves when `node_modules/tickup` is missing or broken. */
const tickupFullEntry = path.join(repoRoot, 'dist/tickup-full.es.js');
const tickupEntry = path.join(repoRoot, 'dist/tickup.es.js');

export default defineConfig({
    publicDir: path.resolve(repoRoot, 'public'),
    plugins: [react()],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        // Longer specifier first so `tickup/full` is not swallowed by a `tickup` prefix rule.
        alias: [
            {find: 'tickup/full', replacement: tickupFullEntry},
            {find: 'tickup', replacement: tickupEntry},
            {find: '@brand', replacement: path.join(repoRoot, 'src/assets/brand')},
        ],
    },
    server: {
        fs: {
            allow: [path.resolve(__dirname, '..')],
        },
    },
    /** Default entry: project `index.html` → `/src/main.tsx` (do not override `rollupOptions.input`). */
});