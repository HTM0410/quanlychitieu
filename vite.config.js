import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Các biến môi trường với tiền tố VITE_ sẽ tự động được inject
})
