// Style configuration must run before tldraw components mount
import { configureStyles } from './components/Canvas/styleConfig'
configureStyles()

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { defineCustomElements } from '@ionic/pwa-elements/loader'
import './index.css'
import App from './App.tsx'
import { SplashAnimation } from './components/SplashAnimation'

// Initialize PWA elements for web camera fallback
// Required for Camera plugin to work on web platform
if (typeof window !== 'undefined') {
  defineCustomElements(window)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SplashAnimation />
    <App />
  </StrictMode>,
)
