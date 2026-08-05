import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@frontend': path.resolve(__dirname, '../frontend/src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, './node_modules/react/jsx-dev-runtime'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      'react-hot-toast': path.resolve(__dirname, './node_modules/react-hot-toast'),
      'recharts': path.resolve(__dirname, './node_modules/recharts'),
      '@vitest/coverage-v8': path.resolve(__dirname, './node_modules/@vitest/coverage-v8'),
      'react-icons': path.resolve(__dirname, '../frontend/node_modules/react-icons'),
    },
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '.')
      ]
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    root: path.resolve(__dirname, '..'),
    include: [
      'tests/unit/frontend/**/*.{test,spec}.{js,jsx}',
      'tests/integration/frontend/**/*.{test,spec}.{js,jsx}',
      'tests/e2e/frontend/**/*.{test,spec}.{js,jsx}',
      'tests/system/frontend/**/*.{test,spec}.{js,jsx}'
    ],
    setupFiles: [path.resolve(__dirname, './utils/setup/vitest-setup.js')],
    coverage: {
      all: true,
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: path.resolve(__dirname, './coverage/frontend'),
      include: ['frontend/src/**/*.{js,jsx}'],
      exclude: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'frontend/src/main.jsx'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
