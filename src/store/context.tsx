import { createContext, useContext, ReactNode } from 'react';
import { useAppStore } from './appStore';

type AppStoreContextType = ReturnType<typeof useAppStore>;

const AppStoreContext = createContext<AppStoreContextType | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const store = useAppStore();
  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useApp must be used within an AppStoreProvider');
  }
  return context;
}
