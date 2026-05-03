import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    root: __dirname,
    alias: {
      '@frontend': path.resolve(__dirname, '../frontend/src'),
    },
    include: ['**/*.{test,spec}.{js,jsx}'],
  },
});
