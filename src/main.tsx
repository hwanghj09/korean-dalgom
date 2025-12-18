// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// 앱 업데이트가 감지되면 자동으로 다시 로드하도록 설정
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('새로운 버전의 앱이 출시되었습니다. 업데이트하시겠습니까?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('앱이 오프라인에서 실행될 준비가 되었습니다.')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)