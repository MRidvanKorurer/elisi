// import react from '@vitejs/plugin-react'
// import { defineConfig } from 'vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })



import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'; // 1. Eklentiyi import et

export default defineConfig({
  plugins: [
    react(), 
    svgr() // 2. Eklentiyi buraya ekle
  ],
});