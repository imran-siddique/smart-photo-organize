import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './components/ErrorFallback.tsx'
import { registerServiceWorker } from './lib/performance.ts'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Register service worker in production
registerServiceWorker()

createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
