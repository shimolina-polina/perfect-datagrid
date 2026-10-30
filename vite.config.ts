import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

const STYLE_ELEMENT_ID = 'perfect-datagrid-style';

function injectStyles(): Plugin {
  let css = '';

  return {
    name: 'perfect-datagrid:inject-styles',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const emitted = Object.values(bundle)
        .map((item) => (item.type === 'asset' && item.fileName.endsWith('.css') ? String(item.source) : ''))
        .filter(Boolean)
        .join('\n');

      if (emitted) css = emitted;
      if (!css) return;

      const snippet = `\n(function () {\n  if (typeof document === 'undefined') return;\n  if (document.getElementById('${STYLE_ELEMENT_ID}')) return;\n  var style = document.createElement('style');\n  style.id = '${STYLE_ELEMENT_ID}';\n  style.textContent = ${JSON.stringify(css)};\n  (document.head || document.documentElement).appendChild(style);\n})();\n`;

      Object.values(bundle).forEach((item) => {
        if (item.type === 'chunk' && item.isEntry) {
          item.code += snippet;
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/demo'],
    }),
    injectStyles(),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'PerfectDatagrid',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    restoreMocks: true,
  },
});
