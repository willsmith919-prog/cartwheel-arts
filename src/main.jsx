import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyBrandTokens } from './theme.js'
import './index.css'
import App from './App.jsx'

applyBrandTokens()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
