"use client"

import React, { memo, useCallback, useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  LogOut,
  Settings,
  ChevronUp,
  Zap,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { NAVIGATION_ITEMS, SECONDARY_NAVIGATION_ITEMS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// Error Boundary personalizado para Next.js
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    FallbackComponent: React.ComponentType<{
      error: Error
      resetErrorBoundary: () => void
    }>
    onError?: (error: Error) => void
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error)
    console.error('Erro capturado pelo Error Boundary:', error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <this.props.FallbackComponent
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}

// Componente de erro melhorado com design moderno
const SidebarErrorFallback = memo(({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void 
}) => (
  <div 
    className="flex flex-col items-center justify-center p-6 text-center rounded-lg bg-gradient-to-br from-red-950/20 to-red-900/10 border border-red-800/30 m-4" 
    role="alert"
    aria-live="assertive"
  >
    <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-red-500/20">
      <AlertTriangle className="w-6 h-6 text-red-400" aria-hidden="true" />
    </div>
    <h2 className="text-lg font-semibold text-red-300 mb-2">
      Erro na Navegação
    </h2>
    <p className="text-sm text-slate-400 mb-4 leading-relaxed">
      Não foi possível carregar a barra lateral.
      <br />
      <span className="text-xs opacity-75">
        {error.message}
      </span>
    </p>
      <button 
        onClick={resetErrorBoundary}
      className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
      aria-label="Tentar recarregar a navegação"
      >
      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
        Tentar Novamente
      </button>
    </div>
))

SidebarErrorFallback.displayName = "SidebarErrorFallback"

// Componente memoizado do item de navegação para otimizar re-renders
const NavigationItem = memo(({ 
  item, 
  isActive, 
  onNavigate 
}: { 
  item: any; 
  isActive: boolean; 
  onNavigate: () => void; 
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton 
      asChild 
      isActive={isActive}
      tooltip={item.description}
      className={cn(
        "group relative w-full justify-start px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-slate-700/50 hover:text-white hover:scale-[1.02]",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800",
        isActive ? [
          "bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white shadow-lg",
          "border-l-4 border-blue-400",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:to-transparent before:rounded-r-lg"
        ] : "text-slate-300 hover:border-l-2 hover:border-slate-600"
      )}
    >
      <Link 
        href={item.url} 
        onClick={onNavigate}
        className="flex items-center w-full"
        aria-current={isActive ? "page" : undefined}
      >
        <item.icon 
          className={cn(
            "size-5 mr-3 flex-shrink-0 transition-transform duration-200",
            isActive ? "text-blue-200 scale-110" : "text-slate-400 group-hover:text-slate-200 group-hover:scale-105"
          )} 
          aria-hidden="true"
        />
        <span className="group-data-[collapsible=icon]:hidden font-medium">
          {item.title}
        </span>
        {isActive && (
          <div className="ml-auto size-2 rounded-full bg-blue-300 shadow-sm group-data-[collapsible=icon]:hidden" />
        )}
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
))

NavigationItem.displayName = "NavigationItem"

// Hook personalizado para lógica do usuário
const useUserData = (user: any) => {
  return useMemo(() => ({
    initials: user?.email ? user.email.charAt(0).toUpperCase() : "U",
    displayName: user?.email ? user.email.split("@")[0] : "Usuário",
    email: user?.email || "usuário@exemplo.com"
  }), [user?.email])
}

export const AppSidebar = memo(({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()
  const userData = useUserData(user)

  // Memoização dos itens de navegação
  const navigationItems = useMemo(() => NAVIGATION_ITEMS, [])
  const secondaryItems = useMemo(() => SECONDARY_NAVIGATION_ITEMS, [])

  // Callback memoizado para navegação
  const handleNavigation = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  // Callback memoizado para logout
  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }, [signOut])

  return (
    <ErrorBoundary
      FallbackComponent={SidebarErrorFallback}
      onError={(error) => console.error("Erro na Sidebar:", error)}
    >
    <Sidebar 
        className="border-r border-slate-700/80 bg-slate-800/95 backdrop-blur-sm" 
      {...props}
    >
        {/* Header com gradiente moderno */}
        <SidebarHeader className="border-b border-slate-700/50 p-4 bg-gradient-to-r from-slate-800 to-slate-750">
        <div className="flex items-center gap-3">
            <div className="relative flex aspect-square size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/25">
              <Zap className="size-6 drop-shadow-sm" aria-hidden="true" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold text-white text-xl tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text">
                StayFocus
              </span>
              <span className="truncate text-xs text-slate-400 font-medium tracking-wide">
                Organização Neurodivergente
              </span>
          </div>
        </div>
      </SidebarHeader>

        <SidebarContent className="px-3 py-6 space-y-8">
          {/* Navegação Principal */}
        <SidebarGroup>
            <SidebarGroupLabel className="text-slate-400 text-xs font-bold uppercase tracking-widest px-3 py-3 group-data-[collapsible=icon]:hidden flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-blue-400" />
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                {navigationItems.map((item) => (
                  <NavigationItem
                    key={item.title}
                    item={item}
                    isActive={pathname === item.url} 
                    onNavigate={handleNavigation}
                  />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

          {/* Navegação Secundária */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-400 text-xs font-bold uppercase tracking-widest px-3 py-3 group-data-[collapsible=icon]:hidden flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-amber-400" />
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                {secondaryItems.map((item) => (
                  <NavigationItem
                    key={item.title}
                    item={item}
                    isActive={pathname === item.url} 
                    onNavigate={handleNavigation}
                  />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

        {/* Footer do usuário com lazy loading */}
        <SidebarFooter className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800 to-slate-750">
        <SidebarMenu>
                      <SidebarMenuItem>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                    <SidebarMenuButton 
                      className={cn(
                        "w-full p-3 rounded-xl transition-all duration-200",
                        "hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50",
                        "data-[state=open]:bg-gradient-to-r data-[state=open]:from-slate-700/70 data-[state=open]:to-slate-600/70",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                      )}
                      aria-label={`Menu do usuário ${userData.displayName}`}
                    >
                      <Avatar className="h-9 w-9 rounded-xl flex-shrink-0 ring-2 ring-blue-500/20">
                        <AvatarImage 
                          src="/placeholder.svg" 
                          alt={`Avatar de ${userData.displayName}`} 
                        />
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold text-sm">
                          {userData.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-3 group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold text-white">
                          {userData.displayName}
                        </span>
                        <span className="truncate text-xs text-slate-400 font-medium">
                          {userData.email}
                        </span>
                  </div>
                      <ChevronUp className="ml-auto size-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                    className="w-64 rounded-xl bg-slate-800/95 border-slate-700/50 backdrop-blur-sm shadow-xl"
                side="top"
                align="end"
                    sideOffset={8}
                  >
                    <div className="p-2">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src="/placeholder.svg" alt={userData.displayName} />
                          <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm">
                            {userData.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {userData.displayName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {userData.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-slate-700/50" />
                    
                <DropdownMenuItem asChild>
                      <Link 
                        href="/perfil" 
                        className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg m-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        onClick={handleNavigation}
                      >
                        <Settings className="mr-3 h-4 w-4" aria-hidden="true" />
                        Configurações da Conta
                  </Link>
                </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-slate-700/50" />
                    
                <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className="cursor-pointer text-red-300 hover:text-red-200 hover:bg-red-900/20 rounded-lg m-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                      <LogOut className="mr-3 h-4 w-4" aria-hidden="true" />
                      Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
                            </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    </ErrorBoundary>
  )
})

AppSidebar.displayName = "AppSidebar"
