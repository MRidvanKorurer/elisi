import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    // Büyük JPEG'ler derleme sırasında webp'ye çevrilir
    imagetools()
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (id.includes('react-router') || id.includes('/react-dom/') || id.includes('/react/')) return 'react';
          return undefined;
        }
      }
    }
  },
  server: {
    watch: {
      ignored: ['**/src/assets/sendgb-p7W4jZ0UCo1/**', '**/dist/**']
    }
  }
});
