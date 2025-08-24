import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCache } from "./lib/auth-cache";

export async function middleware(request: NextRequest) {
  // Criar resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "unknown";

  console.log(
    `🔐 [MIDDLEWARE] Processando: ${pathname} | UA: ${userAgent.substring(0, 50)}`,
  );

  try {
    // Configurar cliente Supabase com configuração otimizada
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = request.cookies.get(name)?.value;
            if (value && name.includes("auth")) {
              console.log(`🍪 [MIDDLEWARE] Cookie auth encontrado: ${name}`);
            }
            return value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
            if (name.includes("auth")) {
              console.log(`🍪 [MIDDLEWARE] Cookie auth definido: ${name}`);
            }
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
            if (name.includes("auth")) {
              console.log(`🍪 [MIDDLEWARE] Cookie auth removido: ${name}`);
            }
          },
        },
        auth: {
          persistSession: true,
          autoRefreshToken: false, // Evitar conflitos no server-side
        },
      },
    );

    // Verificar se há cookies de autenticação presentes
    const authCookies = request.cookies
      .getAll()
      .filter(
        (cookie) =>
          cookie.name.includes("auth") || cookie.name.includes("supabase"),
      );

    console.log(
      `🍪 [MIDDLEWARE] Cookies de auth encontrados: ${authCookies.length}`,
    );

    // Rotas que precisam de autenticação
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

    // Rotas que devem pular verificação de autenticação
    const publicRoutes = ["/auth", "/", "/api/health"];

    // Verificar se é uma rota pública
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route),
    );

    // Verificar se é uma rota protegida (incluindo rotas dinâmicas)
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route),
    );

    console.log(
      `🛡️ [MIDDLEWARE] Rota: ${pathname} | Protegida: ${isProtectedRoute} | Pública: ${isPublicRoute}`,
    );

    // Se for rota pública, permitir acesso sem verificação
    if (isPublicRoute) {
      console.log(`✅ [MIDDLEWARE] Rota pública, acesso liberado: ${pathname}`);
      return addSecurityHeaders(response, startTime, pathname);
    }

    // Se for rota protegida, verificar autenticação
    if (isProtectedRoute) {
      console.log(
        `🔒 [MIDDLEWARE] Verificando autenticação para rota protegida: ${pathname}`,
      );

      // Primeiro, tentar usar cache se disponível
      const cached = authCache.getCachedAuth();
      let isAuthenticated = false;

      if (cached && cached.isValid) {
        // Verificar se a sessão ainda é válida considerando o buffer
        if (authCache.isSessionStillValid(cached.session)) {
          console.log(
            `✅ [MIDDLEWARE] Autenticação válida (cache): ${cached.user?.id?.substring(0, 8)}...`,
          );
          isAuthenticated = true;
        } else {
          console.log(`⚠️ [MIDDLEWARE] Cache expirado, limpando`);
          authCache.clearCache();
        }
      }

      // Se não há cache válido, fazer verificação otimizada
      if (!isAuthenticated) {
        let session = null;
        let sessionError = null;

        try {
          const { data, error } = await supabase.auth.getSession();
          session = data.session;
          sessionError = error;

          if (error) {
            console.error(
              `❌ [MIDDLEWARE] Erro ao obter sessão: ${error.message}`,
            );
          }

          if (session?.user) {
            console.log(
              `✅ [MIDDLEWARE] Sessão válida encontrada: ${session.user.id?.substring(0, 8)}...`,
            );
            
            // Verificar se a sessão não expirou
            const now = Math.floor(Date.now() / 1000);
            const sessionBuffer = 30; // 30 segundos de buffer
            
            if (session.expires_at && session.expires_at <= (now + sessionBuffer)) {
              console.warn(
                `⚠️ [MIDDLEWARE] Sessão prestes a expirar ou expirada`,
              );
              session = null;
            } else {
              // Atualizar cache com nova sessão válida
              authCache.setCachedAuth(session.user, session);
              isAuthenticated = true;
            }
          } else {
            console.warn(`⚠️ [MIDDLEWARE] Nenhuma sessão encontrada`);
          }
        } catch (authError) {
          console.error(
            `❌ [MIDDLEWARE] Erro na verificação de autenticação:`,
            authError,
          );
          sessionError = authError;
        }

        // Se há cookies de autenticação mas não conseguimos obter a sessão,
        // ser mais permissivo (client-side pode recuperar)
        if (!isAuthenticated && authCookies.length > 0) {
          console.log(
            `🤔 [MIDDLEWARE] Sem sessão mas com cookies auth (${authCookies.length}), permitindo acesso`,
          );
          console.log(
            `🔄 [MIDDLEWARE] Client-side vai tentar recuperar autenticação`,
          );
          return addSecurityHeaders(response, startTime, pathname);
        }
      }

      // Se não autenticado e sem cookies, redirecionar para login
      if (!isAuthenticated && authCookies.length === 0) {
        console.log(
          `🚫 [MIDDLEWARE] Sem autenticação, redirecionando para login`,
        );
        const redirectUrl = new URL("/auth", request.url);
        redirectUrl.searchParams.set("redirectTo", pathname);

        const redirectResponse = NextResponse.redirect(redirectUrl);
        return addSecurityHeaders(redirectResponse, startTime, pathname);
      }

      // Se chegou até aqui, usuário está autenticado
      if (isAuthenticated) {
        console.log(`✅ [MIDDLEWARE] Acesso autorizado para: ${pathname}`);
      }
    }

    // Tratamento especial para página de auth
    if (pathname.startsWith("/auth")) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log(
            `🔄 [MIDDLEWARE] Usuário já autenticado, redirecionando da página de auth`,
          );
          const redirectTo =
            request.nextUrl.searchParams.get("redirectTo") || "/";
          const redirectResponse = NextResponse.redirect(
            new URL(redirectTo, request.url),
          );
          return addSecurityHeaders(redirectResponse, startTime, pathname);
        }
      } catch (error) {
        console.log(
          `ℹ️ [MIDDLEWARE] Erro ao verificar sessão na página auth (permitindo acesso):`,
          error,
        );
        // Permitir acesso à página de auth mesmo com erro
      }
    }

    return addSecurityHeaders(response, startTime, pathname);
  } catch (error) {
    console.error(`❌ [MIDDLEWARE] Erro crítico no middleware:`, error);

    // Em caso de erro crítico, permitir acesso para não quebrar a aplicação
    console.log(
      `🚨 [MIDDLEWARE] Permitindo acesso devido a erro crítico: ${pathname}`,
    );
    return addSecurityHeaders(response, startTime, pathname);
  }
}

function addSecurityHeaders(
  response: NextResponse,
  startTime: number,
  pathname: string,
): NextResponse {
  // Adicionar headers de segurança
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  // Adicionar header de timing para debug
  const duration = Date.now() - startTime;
  response.headers.set("X-Middleware-Duration", `${duration}ms`);

  console.log(
    `⏱️ [MIDDLEWARE] Processamento concluído em ${duration}ms para: ${pathname}`,
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't need auth (health)
     * - manifest and other static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/health|manifest|icon-).*)",
  ],
};
