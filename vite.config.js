import { defineConfig } from "vite";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  base: "/starter-project-with-vite/",
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
        start_url: "/starter-project-with-vite/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        description: "StoryMap — aplikasi berbagi cerita dengan peta dan PWA.",
        icons: [
          {
            src: "/starter-project-with-vite/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/starter-project-with-vite/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/starter-project-with-vite/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "cdn-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
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
