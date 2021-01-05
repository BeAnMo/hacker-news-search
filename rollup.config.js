import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.js',
    output: [

        {
            file: 'dist/hengine.js',
            format: 'iife',
            name: 'HEngine',
        },
        {
            file: 'dist/hengine.min.js',
            format: 'iife',
            name: 'HEngine',
            plugins: [terser()]
        }
    ]
};