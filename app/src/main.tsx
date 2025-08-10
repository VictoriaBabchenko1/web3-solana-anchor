import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import AppWalletProvider from "./components/app-wallet-provider/app-wallet-provider.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AppWalletProvider>
          <App />
      </AppWalletProvider>
  </StrictMode>,
)
