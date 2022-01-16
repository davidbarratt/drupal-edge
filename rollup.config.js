import typescript from '@rollup/plugin-typescript';
// plugin-node-resolve and plugin-commonjs are required for a rollup bundled project
// to resolve dependencies from node_modules. See the documentation for these plugins
// for more details.
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser';
import dsv from '@rollup/plugin-dsv';

export default {
  input: 'src/index.ts',
  output: {
    exports: 'named',
    file: 'dist/worker.mjs',
    format: 'es',
    sourcemap: true,
  },
  plugins: [typescript(), commonjs(), dsv(), nodeResolve({ browser: true }), terser()]
};
