import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom', // 关键配置：启用浏览器环境模拟
    setupFiles: './tests/setup.ts',
    isolate: true,
    sequence: {
      tests: 'list'
    }
  }
})
