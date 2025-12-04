import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      'unused/**',
      'node_modules/**'
    ]
  }
})