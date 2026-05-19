import { defineConfig } from 'vite'

export default defineConfig({
  base: '/vanyax/',
  server: { port: 3000, open: true },
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
  },
})
