import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {createRequire} from 'node:module';
import type {ObfuscatorOptions} from 'javascript-obfuscator';

const require = createRequire(import.meta.url);
const {obfuscate} = require('javascript-obfuscator') as typeof import('javascript-obfuscator');

function tickUpLibObfuscator(
    enabled: boolean,
    obfuscatorOptions: ObfuscatorOptions,
): Plugin {
    return {
        name: 'tickup-lib-chunk-obfuscator',
        apply: 'build',
        enforce: 'post',
        renderChunk(code, chunk) {
            if (!enabled || !chunk.fileName.endsWith('.js')) {
                return null;
            }
            const result = obfuscate(code, {
                ...obfuscatorOptions,
                sourceMap: false,
            });
            return {code: result.getObfuscatedCode()};
        },
    };
}

const skipObfuscate =
    process.env.TICKUP_SKIP_OBFUSCATE === '1' ||
    process.env.TICKUP_SKIP_OBFUSCATE === 'true';

const tickUpObfuscatorOptions: ObfuscatorOptions = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: false,
    stringArrayShuffle: true,
    stringArrayRotate: true,
    stringArrayIndexShift: true,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    numbersToExpressions: false,
};

const libEntry = process.env.TICKUP_LIB_ENTRY;

export default defineConfig(({command}) => {
    const plugins = [react(), tickUpLibObfuscator(!skipObfuscate, tickUpObfuscatorOptions)];
    const resolve = {extensions: ['.tsx', '.ts', '.js'] as const};

    if (command === 'build') {
        if (libEntry !== 'index' && libEntry !== 'full') {
            throw new Error(
                'Set TICKUP_LIB_ENTRY=index or TICKUP_LIB_ENTRY=full when running vite build (use npm run build).',
            );
        }
        const entryPath =
            libEntry === 'full'
                ? path.resolve(__dirname, 'src/full.ts')
                : path.resolve(__dirname, 'src/index.ts');
        const fileBase = libEntry === 'full' ? 'tickup-full' : 'tickup';
        return {
            plugins,
            resolve,
            build: {
                /** First entry (`index`) clears `dist/`; `full` appends so both bundles ship on npm. */
                emptyOutDir: libEntry !== 'full',
                sourcemap: skipObfuscate,
                cssCodeSplit: false,
                assetsInlineLimit: 0,
                lib: {
                    entry: entryPath,
                    name: 'TickUp',
                    fileName: (format) => `${fileBase}.${format}.js`,
                    formats: ['es', 'cjs'],
                },
                rollupOptions: {
                    external: ['react', 'react-dom', 'react/jsx-runtime'],
                    output: {
                        inlineDynamicImports: true,
                        globals: {
                            react: 'React',
                            'react-dom': 'ReactDOM',
                            'react/jsx-runtime': 'jsxRuntime',
                        },
                    },
                },
            },
        };
    }

    return {
        plugins,
        resolve,
    };
});
