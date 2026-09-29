import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
    routeRules: {
      // PWA: the manifest needs `application/manifest+json` and the service
      // worker must never be served from a long-lived cache, otherwise clients
      // keep running a stale worker after a deploy.
      "/manifest.webmanifest": {
        headers: {
          "content-type": "application/manifest+json; charset=utf-8",
          "cache-control": "public, max-age=0, must-revalidate",
        },
      },
      "/sw.js": {
        headers: {
          "content-type": "text/javascript; charset=utf-8",
          "cache-control": "public, max-age=0, must-revalidate",
          "service-worker-allowed": "/",
        },
      },
      "/icons/**": {
        headers: { "cache-control": "public, max-age=31536000, immutable" },
      },
    },
  },
});