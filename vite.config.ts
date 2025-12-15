import path from "path"

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/",
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('react-router') || id.includes('@remix-run')) {
              return 'router';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            if (id.includes('zod')) {
              return 'zod';
            }
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
            if (id.includes('jspdf') || id.includes('svg2pdf')) {
              return 'pdf';
            }
            if (id.includes('qr-code-styling') || id.includes('qrcode')) {
              return 'qr';
            }
            if (id.includes('jszip')) {
              return 'jszip';
            }
            if (id.includes('html2canvas')) {
              return 'html2canvas';
            }
            if (id.includes('opentype')) {
              return 'opentype';
            }
            if (id.includes('svgo')) {
              return 'svgo';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms';
            }
          }
        },
      },
    },
  },
})
