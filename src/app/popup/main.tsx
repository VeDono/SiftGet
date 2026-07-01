import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/app/styles/fonts'
import '@/app/styles/theme.css'
import './popup.css'
import { AppProviders } from '@/app/providers/AppProviders'
import { PopupPage } from '@/pages/popup/ui/PopupPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <PopupPage />
    </AppProviders>
  </StrictMode>,
)
