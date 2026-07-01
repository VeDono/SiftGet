import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/app/styles/fonts'
import '@/app/styles/theme.css'
import { AppProviders } from '@/app/providers/AppProviders'
import { OptionsPage } from '@/pages/options/ui/OptionsPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <OptionsPage />
    </AppProviders>
  </StrictMode>,
)
