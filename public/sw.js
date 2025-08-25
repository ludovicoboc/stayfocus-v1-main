/**
 * StayFocus Service Worker - Otimizado para Mobile
 * Cache estratégico e offline experience
 * Versão: 2.0.0
 */

const CACHE_NAME = 'stayfocus-v2.0.0';
const API_CACHE_NAME = 'stayfocus-api-v2.0.0';
const STATIC_CACHE_NAME = 'stayfocus-static-v2.0.0';
const IMAGE_CACHE_NAME = 'stayfocus-images-v2.0.0';

// Cache TTL configurations (mobile-optimized)
const CACHE_TTL = {
  static: 7 * 24 * 60 * 60 * 1000,    // 7 dias para assets estáticos
  api: 5 * 60 * 1000,                 // 5 minutos para APIs
  images: 24 * 60 * 60 * 1000,        // 24 horas para imagens
  pages: 30 * 60 * 1000               // 30 minutos para páginas
};

// URLs para cache estratégico
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/stayfocus_logo.png'
];

// Rotas críticas para PWA
const CRITICAL_ROUTES = [
  '/',
  '/auth',
  '/alimentacao',
  '/estudos',
  '/financas',
  '/saude'
];

// Detect mobile device
function isMobile() {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.0.0');
  
  event.waitUntil(
    (async () => {
      // Cache estático crítico
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      await staticCache.addAll(STATIC_ASSETS);
      
      // Em mobile, cache mais agressivo para economizar dados
      if (isMobile()) {
        const apiCache = await caches.open(API_CACHE_NAME);
        // Pre-cache algumas respostas API críticas se necessário
      }
      
      console.log('[SW] Installation complete');
    })()
  );
  
  // Força ativação imediata
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2.0.0');
  
  event.waitUntil(
    (async () => {
      // Limpar caches antigos
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('stayfocus-') && 
        ![
          CACHE_NAME,
          API_CACHE_NAME, 
          STATIC_CACHE_NAME,
          IMAGE_CACHE_NAME
        ].includes(name)
      );
      
      await Promise.all(
        oldCaches.map(cacheName => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      
      console.log('[SW] Activation complete');
    })()
  );
  
  // Tomar controle de todos os clientes
  self.clients.claim();
});

// Utility: Check if response is valid
function isValidResponse(response) {
  return response && 
         response.status === 200 && 
         response.type === 'basic';
}

// Utility: Check if URL should be cached
function shouldCache(url) {
  const urlObj = new URL(url);
  
  // Não cachear URLs externas (exceto Supabase)
  if (urlObj.origin !== location.origin && 
      !urlObj.origin.includes('supabase.co')) {
    return false;
  }
  
  // Não cachear URLs com parâmetros de debug/desenvolvimento
  if (urlObj.search.includes('_vercel') || 
      urlObj.search.includes('debug')) {
    return false;
  }
  
  return true;
}

// Cache strategy: Network First (para API e dados dinâmicos)
async function networkFirst(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  
  try {
    // Tentar network primeiro
    const networkResponse = await fetch(request);
    
    if (isValidResponse(networkResponse) && shouldCache(request.url)) {
      // Cache com TTL
      const responseClone = networkResponse.clone();
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers),
          'sw-cached-at': Date.now().toString(),
          'sw-ttl': ttl.toString()
        }
      });
      
      await cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Fallback para cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Check TTL
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const cacheTtl = cachedResponse.headers.get('sw-ttl');
      
      if (cachedAt && cacheTtl) {
        const age = Date.now() - parseInt(cachedAt);
        if (age < parseInt(cacheTtl)) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        } else {
          console.log('[SW] Cache expired:', request.url);
          await cache.delete(request);
        }
      }
    }
    
    // Last resort: offline page para navegação
    if (request.mode === 'navigate') {
      console.log('[SW] Serving offline page');
      return cache.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache strategy: Cache First (para assets estáticos)
async function cacheFirst(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check TTL
    const cachedAt = cachedResponse.headers.get('sw-cached-at');
    const cacheTtl = cachedResponse.headers.get('sw-ttl');
    
    if (cachedAt && cacheTtl) {
      const age = Date.now() - parseInt(cachedAt);
      if (age < parseInt(cacheTtl)) {
        console.log('[SW] Cache hit:', request.url);
        return cachedResponse;
      }
    }
  }
  
  // Não está em cache ou expirou
  try {
    const networkResponse = await fetch(request);
    
    if (isValidResponse(networkResponse) && shouldCache(request.url)) {
      const responseClone = networkResponse.clone();
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers),
          'sw-cached-at': Date.now().toString(),
          'sw-ttl': ttl.toString()
        }
      });
      
      await cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network and cache failed:', request.url);
    throw error;
  }
}

// Stale While Revalidate (para dados que podem estar um pouco desatualizados)
async function staleWhileRevalidate(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Sempre tentar buscar nova versão em background
  const fetchPromise = fetch(request).then(response => {
    if (isValidResponse(response) && shouldCache(request.url)) {
      const responseClone = response.clone();
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers),
          'sw-cached-at': Date.now().toString(),
          'sw-ttl': ttl.toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
    }
    return response;
  }).catch(error => {
    console.log('[SW] Background fetch failed:', request.url);
    return null;
  });
  
  // Se tem cache, retorna imediatamente
  if (cachedResponse) {
    console.log('[SW] Serving stale content:', request.url);
    return cachedResponse;
  }
  
  // Se não tem cache, espera o fetch
  return fetchPromise;
}

// Main fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip para non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip para URLs externas não relevantes
  if (!shouldCache(request.url)) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Rotas de navegação (páginas HTML)
        if (request.mode === 'navigate' || 
            (request.headers.get('accept') && 
             request.headers.get('accept').includes('text/html'))) {
          return await networkFirst(request, CACHE_NAME, CACHE_TTL.pages);
        }
        
        // APIs do Supabase - Network First com fallback
        if (url.origin.includes('supabase.co')) {
          // Em mobile, usar stale-while-revalidate para melhor performance
          if (isMobile()) {
            return await staleWhileRevalidate(request, API_CACHE_NAME, CACHE_TTL.api);
          } else {
            return await networkFirst(request, API_CACHE_NAME, CACHE_TTL.api);
          }
        }
        
        // Next.js API routes - Network First
        if (url.pathname.startsWith('/api/')) {
          return await networkFirst(request, API_CACHE_NAME, CACHE_TTL.api);
        }
        
        // Imagens - Cache First
        if (request.destination === 'image' || 
            /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)) {
          return await cacheFirst(request, IMAGE_CACHE_NAME, CACHE_TTL.images);
        }
        
        // Assets estáticos (JS, CSS, fonts) - Cache First
        if (request.destination === 'script' || 
            request.destination === 'style' || 
            request.destination === 'font' ||
            /\.(js|css|woff2?|ttf|eot)$/i.test(url.pathname)) {
          return await cacheFirst(request, STATIC_CACHE_NAME, CACHE_TTL.static);
        }
        
        // Outros recursos - Network First
        return await networkFirst(request, CACHE_NAME, CACHE_TTL.pages);
        
      } catch (error) {
        console.error('[SW] Fetch handler error:', error);
        
        // Fallback final para páginas
        if (request.mode === 'navigate') {
          const cache = await caches.open(STATIC_CACHE_NAME);
          return cache.match('/offline.html');
        }
        
        throw error;
      }
    })()
  );
});

// Background sync para quando voltar online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sincronizar dados pendentes quando voltar online
      syncPendingData()
    );
  }
});

// Sync function placeholder
async function syncPendingData() {
  console.log('[SW] Syncing pending data...');
  // Implementar sincronização de dados offline
  // Por exemplo, enviar dados armazenados em IndexedDB
}

// Message handler para comunicação com a app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_STATS') {
    event.ports[0].postMessage({
      caches: {
        [CACHE_NAME]: 'pages',
        [API_CACHE_NAME]: 'api', 
        [STATIC_CACHE_NAME]: 'static',
        [IMAGE_CACHE_NAME]: 'images'
      }
    });
  }
});

// Periodic cleanup (remove expired entries)
setInterval(async () => {
  const cacheNames = [CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME, IMAGE_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const cachedAt = response.headers.get('sw-cached-at');
          const ttl = response.headers.get('sw-ttl');
          
          if (cachedAt && ttl) {
            const age = Date.now() - parseInt(cachedAt);
            if (age > parseInt(ttl)) {
              console.log('[SW] Cleaning expired cache:', request.url);
              await cache.delete(request);
            }
          }
        }
      }
    } catch (error) {
      console.error('[SW] Cache cleanup error:', error);
    }
  }
}, 60 * 60 * 1000); // Cleanup a cada hora

console.log('[SW] StayFocus Service Worker v2.0.0 loaded');