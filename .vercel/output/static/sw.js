/* كنيسة القديس مارمرقس والبابا أثناسيوس — minimal service worker.
 *
 * Policy (deliberately conservative):
 *  - Navigations (HTML): network-first, NEVER cached. Authenticated pages must
 *    never be served from a cache, and going offline must not leak stale shells.
 *  - Server functions (/_serverFn/*), API routes (/api/*), anything Supabase,
 *    and every cross-origin request: passed straight to the network, never
 *    read from or written to the cache.
 *  - Static build output only (hashed JS/CSS, fonts, images, manifest):
 *    cache-first with a background revalidate.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `church-service-static-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

const OFFLINE_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>لا يوجد اتصال بالإنترنت</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #faeed6;
        color: #16182b;
        font-family: system-ui, "Segoe UI", Tahoma, sans-serif;
        text-align: center;
        padding: 1.5rem;
      }
      main { max-width: 26rem; }
      h1 { font-size: 1.375rem; margin: 0 0 0.75rem; }
      p { margin: 0; line-height: 1.7; opacity: 0.75; }
      button {
        margin-top: 1.5rem;
        padding: 0.7rem 1.6rem;
        border: 0;
        border-radius: 999px;
        background-color: #16182b;
        color: #faf3e2;
        font: inherit;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>لا يوجد اتصال بالإنترنت</h1>
      <p>
        تعذّر تحميل الصفحة. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة. يجب أن تكون
        متصلاً بالإنترنت لاستخدام نظام إدارة الخدمة والمخدومين.
      </p>
      <button type="button" onclick="location.reload()">إعادة المحاولة</button>
    </main>
  </body>
</html>`;

// Only hashed build output, fonts and images are ever eligible for caching.
const STATIC_ASSET_RE =
  /\.(?:js|mjs|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|webmanifest)$/i;

// Path prefixes that must always hit the network.
const NEVER_CACHE_PATHS = ["/api/", "/_serverFn/", "/_server/", "/sw.js"];

function shouldBypass(request, url) {
  if (request.method !== "GET") return true;
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  // Supabase and any other third-party origin stay untouched.
  if (url.origin !== self.location.origin) return true;
  if (url.hostname.includes("supabase")) return true;
  if (NEVER_CACHE_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path))) {
    return true;
  }
  return false;
}

function isStaticAsset(url) {
  return STATIC_ASSET_RE.test(url.pathname);
}

function offlineFallback() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

// Network-first. The response is returned straight to the page and never stored,
// so authenticated HTML can never be replayed from the cache.
async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    // Offline (or the network is unreachable) — show the offline page.
    return offlineFallback();
  }
}

// Cache-first with a background revalidate, restricted to same-origin assets.
async function handleStaticAsset(request, event) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === "basic") {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    event.waitUntil(networkPromise);
    return cached;
  }

  const response = await networkPromise;
  if (response) return response;
  return new Response("", { status: 504, statusText: "Offline" });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      // A failed precache must not block installation.
      .then(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("church-service-static-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (shouldBypass(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request, event));
  }
});
