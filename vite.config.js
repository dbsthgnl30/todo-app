import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1218 , // 여기에 원하는 포트 번호 입력
    proxy: {                              // 추가
      '/api': 'http://localhost:8000',    // 추가
    }
  }
})