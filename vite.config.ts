import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['chokidar', 'node-pty'],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload/index.ts'),
        vite: {
          build: {
            outDir: 'dist-electron/preload',
          },
        },
      },
      renderer: {},
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.3'),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@codemirror') || id.includes('codemirror') || id.includes('@lezer')) {
              return 'codemirror';
            }
            if (id.includes('@xterm')) {
              return 'xterm';
            }
            if (id.includes('js-beautify')) {
              return 'beautify';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('react') || id.includes('zustand')) {
              return 'react-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
