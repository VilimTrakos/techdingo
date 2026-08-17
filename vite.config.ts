import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Mora točno odgovarati imenu GitHub repozitorija (project page: user.github.io/techdingo/).
  base: process.env.CI ? '/techdingo/' : '/',
  plugins: [react(), tailwindcss()],
})
