// Configuração do Workbox para StayFocus Alimentação
// Define como o service worker deve ser gerado e quais assets precache

module.exports = {
  // Diretório onde estão os assets para precache
  globDirectory: '.next/',
  
  // Padrões de arquivos para incluir no precache
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,woff,woff2,ttf,eot,ico}'
  ],
  
  // Onde o service worker será gerado
  swDest: 'public/sw.js',
  
  // Configurações do service worker
  skipWaiting: true,
  clientsClaim: true,
  
  // Estratégias de cache em runtime
  runtimeCaching: [
    {
      // API Supabase - NetworkFirst
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'stayfocus-api-cache-v1',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300 // 5 minutos
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      // Imagens - CacheFirst
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'stayfocus-images-cache-v1',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 86400 // 24 horas
        }
      }
    },
    {
      // Assets estáticos - CacheFirst
      urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'stayfocus-static-cache-v1',
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 604800 // 7 dias
        }
      }
    },
    {
      // Páginas da aplicação - StaleWhileRevalidate
      urlPattern: /^https:\/\/stayfocus\.(?:app|vercel\.app)\//,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'stayfocus-pages-cache-v1',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 3600 // 1 hora
        }
      }
    },
    {
      // API Routes Next.js - NetworkFirst
      urlPattern: /^https:\/\/stayfocus\.(?:app|vercel\.app)\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'nextjs-api-cache-v1',
        networkTimeoutSeconds: 2,
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 300 // 5 minutos
        }
      }
    },
    {
      // Google Fonts - StaleWhileRevalidate
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets-v1'
      }
    },
    {
      // Google Fonts Webfonts - CacheFirst
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts-v1',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 31536000 // 1 ano
        }
      }
    }
  ],
  
  // Excluir alguns arquivos do precache
  globIgnores: [
    '**/node_modules/**/*',
    '**/*.map',
    '**/.*',
    '**/_next/static/chunks/webpack-*.js'
  ],
  
  // Configurações de manifest
  manifestTransforms: [
    (manifestEntries) => {
      // Remove arquivos muito grandes do precache
      const filteredEntries = manifestEntries.filter(entry => {
        const maxSize = 2 * 1024 * 1024; // 2MB
        return entry.size <= maxSize;
      });
      
      return {
        manifest: filteredEntries,
        warnings: []
      };
    }
  ],
  
  // Configurações adicionais
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2MB
  
  // Modo de desenvolvimento
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production'
};