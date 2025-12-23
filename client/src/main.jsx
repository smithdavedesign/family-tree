import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initErrorLogging } from './utils/errorLogger'

import { SubscriptionProvider } from './context/SubscriptionContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Initialize free error logging
initErrorLogging();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider>
        <App />
      </SubscriptionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
