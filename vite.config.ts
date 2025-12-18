import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 서비스 워커 자동 업데이트
      manifest: {
        name: '국어 달곰',
        short_name: '국어달곰',
        description: '국어 영역 문제를 풀고 해설을 확인하는 학습 앱',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});