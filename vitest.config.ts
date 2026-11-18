import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: [
          'src/features/workflow/{domain,model,services,store}/**/*.ts',
        ],
        reporter: ['text', 'html'],
      },
    },
  }),
)
