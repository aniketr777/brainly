import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
      throw new Error("Missing Publishable Key");
    }
createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        {/* <Toaster position="top-right" reverseOrder={false} /> */}
        <App />
      </BrowserRouter>
    </ClerkProvider>
  // </StrictMode>
);
