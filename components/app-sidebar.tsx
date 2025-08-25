'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { NAVIGATION_ITEMS, SECONDARY_NAVIGATION_ITEMS } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { useIsMobile } from '@/hooks/use-mobile'
import { memo, useCallback, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onClose: () => void
  isOpen: boolean
}

// Combinar navegação principal e secundária como no projeto atual
const useNavigationItems = () => {
  return useMemo(() => [
    ...NAVIGATION_ITEMS,
    ...SECONDARY_NAVIGATION_ITEMS
  ], [])
}

// Hook para dados do usuário (mantendo lógica atual)
const useUserData = (user: any) => {
  return useMemo(() => ({
    initials: user?.email ? user.email.charAt(0).toUpperCase() : "U",
    displayName: user?.email ? user.email.split("@")[0] : "Usuário",
    email: user?.email || "usuário@exemplo.com"
  }), [user?.email])
}

// Componente de item de navegação otimizado
const NavigationItem = memo(({ 
  item, 
  isActive, 
  onNavigate 
}: { 
  item: any
  isActive: boolean
  onNavigate: () => void
}) => {
  const IconComponent = item.icon

  return (
    <Link
      href={item.url}
      className={cn(
        "flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-700",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        isActive 
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" 
          : "text-gray-700 dark:text-gray-200"
      )}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      tabIndex={0}
    >
      <IconComponent 
        className="mr-3 h-5 w-5 flex-shrink-0" 
        aria-hidden="true" 
      />
      <span>{item.title}</span>
    </Link>
  )
})

NavigationItem.displayName = "NavigationItem"

export const AppSidebar = memo(({ onClose, isOpen }: SidebarProps) => {
  const pathname = usePathname() ?? ''
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const navigationItems = useNavigationItems()
  const userData = useUserData(user)

  // Callback para navegação que fecha o sidebar
  const handleNavigation = useCallback(() => {
    onClose()
  }, [onClose])

  // Gerenciar navegação por teclado
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Prevenir scroll do body quando sidebar está aberta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus no primeiro elemento focável após um pequeno delay
      const timer = setTimeout(() => {
        const firstFocusable = document.querySelector('[role="document"] button, [role="document"] a')
        if (firstFocusable) {
          (firstFocusable as HTMLElement).focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Se não está aberto, não renderizar nada
  if (!isOpen) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex" 
      role="dialog" 
      aria-modal="true" 
      aria-label="Menu principal"
      onKeyDown={handleKeyDown}
    >
      {/* Overlay escuro com backdrop blur */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar com design limpo estilo Anatel2 + responsividade */}
      <div 
        className={cn(
          "relative flex flex-col",
          "bg-white dark:bg-gray-800",
          "shadow-xl border-r border-gray-200 dark:border-gray-700",
          "transform transition-all duration-300 ease-in-out",
          // Responsive width
          isMobile 
            ? "w-72 max-w-[80vw]" // Mobile: um pouco mais largo
            : "w-64 max-w-xs"     // Desktop: tamanho padrão
        )}
        tabIndex={-1}
        role="document"
      >
        {/* Header da sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {/* Logo simplificado */}
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                StayFocus
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organização Neurodivergente
              </p>
            </div>
          </div>
          
          {/* Botão fechar */}
          <button
            className={cn(
              "p-2 rounded-md text-gray-500 hover:text-gray-700",
              "dark:text-gray-400 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "transition-colors duration-200"
            )}
            onClick={onClose}
            aria-label="Fechar menu"
            tabIndex={0}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        
        {/* Conteúdo de navegação */}
        <nav 
          className="flex-1 p-4 overflow-y-auto"
          aria-label="Navegação principal"
        >
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
              
              return (
                <NavigationItem
                  key={item.title}
                  item={item}
                  isActive={isActive}
                  onNavigate={handleNavigation}
                />
              )
            })}
          </div>
        </nav>

        {/* Footer com informações do usuário (se logado) */}
        {user && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span className="text-white font-medium text-sm">
                  {userData.initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userData.displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userData.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

AppSidebar.displayName = "AppSidebar"

export default AppSidebar