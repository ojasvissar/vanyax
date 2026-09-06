import { defineConfig } from 'vite'
import { resolve } from 'path'

const src = resolve(__dirname, 'src')

// The site's source root is src/, so a page's path there is its URL: src/about/
// index.html is served and built at /about/. Keep it that way — moving a page
// directory moves the live URL.
export default defineConfig({
  root: src,
  base: '/vanyax/',
  server: { port: 3000, open: true },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        home: resolve(src, 'index.html'),
        collaborate: resolve(src, 'collaborate/index.html'),
        openSource: resolve(src, 'open-source/index.html'),
        projects: resolve(src, 'projects/index.html'),
        about: resolve(src, 'about/index.html'),
        explore: resolve(src, 'explore/index.html'),
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
  },
})
