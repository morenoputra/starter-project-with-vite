import { defineConfig } from "vite";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";

const BASE_PATH = "/starter-project-with-vite/";

export default defineConfig({
  base: BASE_PATH,
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "src", "public"),
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "public/sw.js",
          dest: ".",
        },
      ],
    }),
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      filename: "sw.js",
      manifest: {
        name: "StoryMap",
        short_name: "StoryMap",
        start_url: BASE_PATH, 
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        description: "StoryMap — aplikasi berbagi cerita dengan peta dan PWA.",
        icons: [
          {
            
            src: `${BASE_PATH}icons/icon-192.svg`,
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: `${BASE_PATH}icons/icon-512.svg`,
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: `${BASE_PATH}icons/icon-512.svg`,
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ], 
        scope: BASE_PATH,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"], // ... (runtimeCaching lainnya tetap sama)
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    hmr: true,
  },
});
