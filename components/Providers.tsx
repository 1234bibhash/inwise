'use client'

import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { SettingsProvider } from '@/lib/context/SettingsContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SettingsProvider>
  )
}
