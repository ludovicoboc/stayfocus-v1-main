import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StayFocus - Gerenciamento Inteligente de Vida",
    short_name: "StayFocus",
    description: "Aplicativo completo para gerenciamento de alimentação, estudos, finanças, saúde e produtividade - otimizado para mobile",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#0f172a",
    theme_color: "#1e293b",
    orientation: "portrait-primary",
    
    // Ícones otimizados para diferentes resoluções e contextos
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    
    // Categorias para app stores
    categories: ["health", "lifestyle", "productivity", "education", "finance"],
    
    // Idioma e localização
    lang: "pt-BR",
    dir: "ltr",
    
    // Preferências de plataforma
    prefer_related_applications: false,
    
    // Shortcuts para ações rápidas (Android)
    shortcuts: [
      {
        name: "Registrar Refeição",
        short_name: "Refeição",
        description: "Adicionar nova refeição rapidamente",
        url: "/alimentacao?action=add",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          }
        ]
      },
      {
        name: "Sessão de Estudo",
        short_name: "Estudar",
        description: "Iniciar nova sessão de estudos",
        url: "/estudos?action=start",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          }
        ]
      },
      {
        name: "Registrar Gasto",
        short_name: "Gasto",
        description: "Adicionar nova despesa",
        url: "/financas?action=expense",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          }
        ]
      },
      {
        name: "Dashboard",
        short_name: "Home",
        description: "Ver resumo geral das atividades",
        url: "/",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          }
        ]
      }
    ],
    
    // Screenshots para app stores (PWA)
    screenshots: [
      {
        src: "/images/screenshot-mobile-1.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Tela principal do StayFocus"
      },
      {
        src: "/images/screenshot-mobile-2.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Módulos de gerenciamento"
      },
      {
        src: "/images/screenshot-desktop-1.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Dashboard desktop"
      }
    ],
    
    // Configurações de protocolo personalizado
    protocol_handlers: [
      {
        protocol: "web+stayfocus",
        url: "/?action=%s"
      }
    ],
    
    // Edge cases e fallbacks
    id: "stayfocus-pwa"
  }
}
