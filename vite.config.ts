import type {} from "nitro/vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
  },
  vite: {
    // Vercel builds on a remote machine and does not carry the function's
    // `node_modules` folder the way the local trace step does, so any package
    // left external surfaces as ERR_MODULE_NOT_FOUND at runtime. Force tslib
    // into the bundle and point it at tslib's ESM entry, since inlining the CJS
    // entry breaks the __toESM interop for the radix-ui chunks that import it.
    nitro: {
      noExternals: ["tslib"],
    },
    resolve: {
      alias: [{ find: /^tslib$/, replacement: "tslib/tslib.es6.mjs" }],
    },
  },
});