const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  target: ['es2020'],
  format: 'iife',
  outfile: 'dist/tracker.js',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  sourcemap: false,
}).catch(() => process.exit(1));
