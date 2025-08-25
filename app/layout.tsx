import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { AppHeader } from "@/components/app-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { ServiceWorkerManager } from "@/components/service-worker-manager"
// import { PerformanceAlerts } from "@/components/performance-alerts" // Temporariamente desabilitado

// 🔤 FONT OPTIMIZATION
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
})

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist'
})

export const metadata: Metadata = {
  title: "StayFocus - Desenvolvimento Pessoal",
  description: "Aplicativo completo de desenvolvimento pessoal e produtividade para pessoas neurodivergentes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StayFocus",
  },
  generator: "v0.dev",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* 🔗 RESOURCE HINTS */}
        <link rel="preconnect" href="https://api.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//api.supabase.co" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preload" href="/fonts/geist.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="prefetch" href="/icon-512x512.png" />
        
        {/* 🖼️ PWA ICONS */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        
        {/* 📱 MOBILE OPTIMIZATION */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StayFocus" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 🛡️ SECURITY */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className={`${inter.className} ${geist.variable} bg-gray-50 dark:bg-gray-900`}>
        <ServiceWorkerManager />
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem={true} 
          disableTransitionOnChange
        >
          <div className="flex h-screen overflow-hidden">
            <div className="flex flex-col flex-1 overflow-hidden">
              <AppHeader />
              <main className="flex-1 overflow-y-auto p-4">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
          {/* <PerformanceAlerts /> */}
        </ThemeProvider>
      </body>
    </html>
  )
}