import {
  Settings,
  getDefaultSettings,
  getSettings,
  setSettings as saveSettings
} from '@/lib/storage'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

type SettingsContextType = {
  settings: Settings
  isLoading: boolean
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>
}

const defaultSettings = getDefaultSettings()

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  updateSettings: async () => {}
})

/**
 * Hook to use the settings context
 * Must be used within a SettingsProvider
 */
export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

type SettingsProviderProps = {
  children: ReactNode
}

/**
 * Settings Provider Component
 * Initializes settings from chrome.storage and provides context to children
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await getSettings()
        if (storedSettings) {
          setSettingsState(storedSettings)
        } else {
          await saveSettings(defaultSettings)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Update multiple settings at once
  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      const updated = { ...settings, ...newSettings }
      setSettingsState(updated)
      await saveSettings(updated)
    },
    [settings]
  )

  const contextValue: SettingsContextType = {
    settings,
    isLoading,
    updateSettings
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}
