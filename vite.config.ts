import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so a built bundle also works from a subdirectory
  // (GitHub Pages, a shared network folder, or opened straight off disk).
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5180, open: true },
})
