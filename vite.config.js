import { defineConfig } from 'vite';

export default defineConfig({
  // Electron loads dist/index.html with file:// in production, so generated
  // asset URLs must remain relative rather than root-relative.
  base: './',
  build: {
    sourcemap: false,
    target: 'es2022'
  }
});
