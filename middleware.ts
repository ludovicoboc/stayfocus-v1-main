import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { optimizedAuthCache } from "./lib/auth-cache";

// Cache para verificações de rota (reduzir overhead)
const routeVerificationCache = new Map<string, { isProtected: boolean; timestamp: number }>();
const ROUTE_CACHE_TTL = 60 * 1000; // 1 minuto

// Otimização: detectar mobile para ajustar timeouts
function isMobileRequest(userAgent: string): boolean {
  return /Mobi|Android|iPhone|iPad/i.test(userAgent);
}

export async function middleware(request: NextRequest) {
  // Limpeza periódica do cache de rotas (Edge Runtime compatible)
  const now = Date.now();
  if (routeVerificationCache.size > 100) {
    for (const [key, value] of routeVerificationCache.entries()) {
      if ((now - value.timestamp) > (5 * ROUTE_CACHE_TTL)) {
        routeVerificationCache.delete(key);
      }
    }
  }

  // Criar resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "unknown";
  const isMobile = isMobileRequest(userAgent);

  console.log(
    `🔐 [MIDDLEWARE-OPTIMIZED] Processando: ${pathname} | Mobile: ${isMobile} | UA: ${userAgent.substring(0, 30)}`
  );

  try {
    // === OTIMIZAÇÃO 1: Cache de classificação de rotas ===
    const routeCacheKey = pathname;
    const cachedRoute = routeVerificationCache.get(routeCacheKey);
    
    let isProtectedRoute = false;
    let isPublicRoute = false;
    
    if (cachedRoute && (Date.now() - cachedRoute.timestamp) < ROUTE_CACHE_TTL) {
      // Usar cache de rota
      isProtectedRoute = cachedRoute.isProtected;
      isPublicRoute = !cachedRoute.isProtected;
      console.log(`⚡ [MIDDLEWARE-OPTIMIZED] Cache hit para rota: ${pathname}`);
    } else {
      // Classificar rota e cachear resultado
      const protectedRoutes = [
        "/concursos",
        "/estudos",
        "/alimentacao", 
        "/autoconhecimento",
        "/financas",
        "/hiperfocos",
        "/lazer",
        "/perfil",
        "/receitas",
        "/roadmap",
        "/saude",
        "/sono",
      ];
      
      const publicRoutes = ["/auth", "/", "/api/health"];
      
      isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route)
      );
      
      isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );
      
      // Cachear classificação da rota
      routeVerificationCache.set(routeCacheKey, {
        isProtected: isProtectedRoute,
        timestamp: Date.now()
      });
    }

    console.log(
      `🛡️ [MIDDLEWARE-OPTIMIZED] Rota: ${pathname} | Protegida: ${isProtectedRoute} | Pública: ${isPublicRoute} | Mobile: ${isMobile}`
    );

    // === OTIMIZAÇÃO 2: Saída rápida para rotas públicas ===
    if (isPublicRoute) {
      console.log(`✅ [MIDDLEWARE-OPTIMIZED] Rota pública, acesso liberado: ${pathname}`);
      return addSecurityHeaders(response, startTime, pathname);
    }

    // === OTIMIZAÇÃO 3: Verificação de auth com cache inteligente ===
    if (isProtectedRoute) {
      console.log(
        `🔒 [MIDDLEWARE-OPTIMIZED] Verificando autenticação para rota protegida: ${pathname}`
      );

      let isAuthenticated = false;
      let cachedAuth = null;

      // Primeiro: tentar cache otimizado
      try {
        cachedAuth = optimizedAuthCache.getCachedAuth();
        if (cachedAuth && cachedAuth.isValid) {
          if (optimizedAuthCache.isSessionStillValid(cachedAuth.session)) {
            console.log(
              `✅ [MIDDLEWARE-OPTIMIZED] Autenticação válida (cache otimizado): ${cachedAuth.user?.id?.substring(0, 8)}...`
            );
            isAuthenticated = true;
          } else {
            console.log(`⚠️ [MIDDLEWARE-OPTIMIZED] Cache expirado, limpando`);
            optimizedAuthCache.clearCache();
          }
        }
      } catch (cacheError) {
        console.warn(`⚠️ [MIDDLEWARE-OPTIMIZED] Erro no cache otimizado:`, cacheError);
      }

      // Se não há cache válido: configurar Supabase apenas quando necessário
      if (!isAuthenticated) {
        console.log(`🔄 [MIDDLEWARE-OPTIMIZED] Verificação Supabase necessária`);
        
        // Configurar cliente Supabase com configuração otimizada
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                const value = request.cookies.get(name)?.value;
                return value;
              },
              set(name: string, value: string, options: any) {
                request.cookies.set({ name, value, ...options });
                response = NextResponse.next({ request: { headers: request.headers } });
                response.cookies.set({ name, value, ...options });
              },
              remove(name: string, options: any) {
                request.cookies.set({ name, value: "", ...options });
                response = NextResponse.next({ request: { headers: request.headers } });
                response.cookies.set({ name, value: "", ...options });
              },
            },
            auth: {
              persistSession: true,
              autoRefreshToken: false,
            },
          }
        );

        // Verificação otimizada com timeout para mobile
        try {
          const timeoutMs = isMobile ? 8000 : 5000;
          const sessionPromise = supabase.auth.getSession();
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Auth timeout')), timeoutMs);
          });
          
          const { data, error } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;
          
          if (error) {
            console.error(`❌ [MIDDLEWARE-OPTIMIZED] Erro ao obter sessão: ${error.message}`);
          } else if (data?.session?.user) {
            const session = data.session;
            console.log(
              `✅ [MIDDLEWARE-OPTIMIZED] Sessão válida encontrada: ${session.user.id?.substring(0, 8)}...`
            );
            
            // Verificar expiração com buffer
            const now = Math.floor(Date.now() / 1000);
            const sessionBuffer = 30;
            
            if (session.expires_at && session.expires_at <= (now + sessionBuffer)) {
              console.warn(`⚠️ [MIDDLEWARE-OPTIMIZED] Sessão prestes a expirar`);
            } else {
              // Atualizar cache otimizado
              optimizedAuthCache.setCachedAuth(session.user, session, 'fresh');
              isAuthenticated = true;
            }
          } else {
            console.warn(`⚠️ [MIDDLEWARE-OPTIMIZED] Nenhuma sessão encontrada`);
          }
        } catch (authError: any) {
          console.error(`❌ [MIDDLEWARE-OPTIMIZED] Erro na verificação:`, authError?.message || authError);
        }
      }

      // === OTIMIZAÇÃO 4: Redirecionamento otimizado ===
      if (!isAuthenticated) {
        console.log(
          `🚫 [MIDDLEWARE-OPTIMIZED] Acesso negado para: ${pathname} - Redirecionando para /auth`
        );

        const redirectUrl = new URL("/auth", request.url);
        // Para mobile: adicionar parâmetro para otimizar UX
        if (isMobile) {
          redirectUrl.searchParams.set("mobile", "true");
        }
        redirectUrl.searchParams.set("redirect", pathname);

        const redirectResponse = NextResponse.redirect(redirectUrl);
        return addSecurityHeaders(redirectResponse, startTime, pathname, { redirected: true });
      }

      console.log(`✅ [MIDDLEWARE-OPTIMIZED] Acesso autorizado para: ${pathname}`);
    }

    // === OTIMIZAÇÃO 5: Headers de segurança e cache ===
    return addSecurityHeaders(response, startTime, pathname, {
      isMobile,
      isAuthenticated: isProtectedRoute
    });
  } catch (error) {
    console.error(`❌ [MIDDLEWARE-OPTIMIZED] Erro inesperado:`, error);
    return addSecurityHeaders(response, startTime, pathname, { error: true });
  }
}

/**
 * Adiciona headers de segurança otimizados
 */
function addSecurityHeaders(
  response: NextResponse,
  startTime: number,
  pathname: string,
  context?: { 
    isMobile?: boolean; 
    isAuthenticated?: boolean;
    error?: boolean;
    redirected?: boolean;
    cached?: boolean;
    rateLimited?: boolean;
    userId?: string;
    fallback?: boolean;
  }
) {
  const duration = Date.now() - startTime;
  const {
    isMobile = false,
    isAuthenticated = false,
    error = false,
    redirected = false,
    cached = false,
    userId
  } = context || {};

  // Headers básicos de segurança
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  // Cache otimizado para mobile
  if (isMobile && !error && !redirected) {
    response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  }

  // Headers de debug e monitoramento
  response.headers.set("X-Middleware-Duration", `${duration}ms`);
  response.headers.set("X-Middleware-Version", "optimized-v1.0");
  
  if (cached) response.headers.set("X-Auth-Source", "cache");
  if (userId) response.headers.set("X-User-Id", userId.substring(0, 8));
  if (error) response.headers.set("X-Auth-Error", "true");
  
  console.log(
    `⚡ [MIDDLEWARE-OPTIMIZED] Concluído: ${pathname} | ${duration}ms | Mobile: ${isMobile} | Auth: ${isAuthenticated} | Error: ${error}`
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|sw.js|manifest.json).*)",
  ],
};
