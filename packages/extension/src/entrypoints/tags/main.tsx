import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'

import Tags from '@/components/Screens/Tags'
import ErrorBoundary from '@/components/parts/ErrorBoundary'

import '@/styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
      retry: (failureCount: number): boolean => {
        return failureCount < 3
      }
    },
    mutations: {
      retry: 0
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Tags />
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
)
