import { defineConfig } from 'vite';

export default defineConfig({
  // Keep generated dependencies separate from node_modules, which can have
  // different permissions when installed from a sandbox or another account.
  cacheDir: '.vite-cache',
});
