import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
    // No `routeRules` here on purpose. Nitro's Vercel preset turns every
    // routeRule that carries `headers` into a Build Output API v3 route with
    // no `continue` flag, and Vercel treats such a route as terminal: the
    // request is answered with the headers and an empty body, which surfaced
    // as "Server-Side Runtime Error (HTTP 500)" and broke the SSR routes.
    // The PWA assets are plain files in `public/`, so they are served by the
    // `filesystem` handle with the right content type and no extra rules.
  },
});
