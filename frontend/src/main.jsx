import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { ChatbotProvider } from './context/ChatbotContext'
import LanguageGuard from './components/LanguageGuard'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <LanguageGuard>
          <AuthProvider>
            <ChatbotProvider>
              <App />
            </ChatbotProvider>
          </AuthProvider>
        </LanguageGuard>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
