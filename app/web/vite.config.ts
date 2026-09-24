import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Web とモバイルの共通コード（src/shared/README.md）
    alias: { '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)) },
  },
  server: {
    host: true,
    port: 3000,
  },
})
