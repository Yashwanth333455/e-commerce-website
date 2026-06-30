import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  createRoot(document.getElementById('root')).render(
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      backgroundColor: '#0f0f14',
      color: '#f8f8ff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'center',
    }}>
      <div style={{
        maxWidth: '480px',
        padding: '32px',
        borderRadius: '24px',
        background: 'linear-gradient(145deg, #16131f 0%, #0f0f14 100%)',
        border: '1px solid rgba(239, 114, 114, 0.25)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 80px rgba(239,114,114,0.05)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 114, 114, 0.1)',
          border: '1px solid rgba(239, 114, 114, 0.3)',
          marginBottom: '20px',
        }}>
          <span style={{ fontSize: '24px', color: '#ef7272' }}>⚠️</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Configuration Required</h2>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '24px' }}>
          The Clerk Publishable Key is missing from the environment. Please add <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> to your Vercel Project Environment Variables, then trigger a redeploy.
        </p>
        <a 
          href="https://vercel.com" 
          target="_blank" 
          rel="noreferrer"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            backgroundColor: '#ef7272',
            color: '#ffffff',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go to Vercel Dashboard
        </a>
      </div>
    </div>
  );
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </StrictMode>,
  );
}
