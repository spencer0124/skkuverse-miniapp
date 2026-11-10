import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Root-absolute, not './'. A relative base makes a deep link ask for
  // /some/path/assets/index-<hash>.js, which the single-page fallback answers
  // with index.html, and the module is rejected on its MIME type.
  base: '/',
});
