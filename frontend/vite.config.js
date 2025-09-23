import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com; connect-src 'self' http://localhost:5000 https://api.razorpay.com https://*.razorpay.com https://checkout.razorpay.com https://nominatim.openstreetmap.org; style-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com; frame-src 'self' https://checkout.razorpay.com https://*.razorpay.com; img-src 'self' data: https:; font-src 'self' data: https:; object-src 'none';"
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
