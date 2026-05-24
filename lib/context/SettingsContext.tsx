'use client'

import React, { createContext, useContext, useState } from 'react'
import { SettingsModal } from '@/components/SettingsModal'

interface SettingsContextType {
  openSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SettingsContext.Provider value={{ openSettings: () => setIsOpen(true) }}>
      {children}
      <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
