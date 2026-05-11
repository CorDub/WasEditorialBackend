import { defineConfig } from 'vitest/config';
import { execSync } from "child_process";

export default defineConfig({
  test: {
    exclude: [
      'unused/**',
      'node_modules/**'
    ]
  }
})