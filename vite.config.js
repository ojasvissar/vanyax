import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/vanyax/',
  server: { port: 3000, open: true },
  build: {
    outDir: 'dist',
    target: 'es2022',
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        collaborate: resolve(__dirname, 'collaborate/index.html'),
        openSource: resolve(__dirname, 'open-source/index.html'),
        projects: resolve(__dirname, 'projects/index.html'),
        about: resolve(__dirname, 'about/index.html'),
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
  },
})
