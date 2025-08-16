'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Bed, Anchor, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { AppSidebar } from './app-sidebar'
import { ThemeToggle } from './theme-toggle'
import { AuthenticationDropdown } from './authentication-dropdown'
import { UserAccountDropdown } from './user-account-dropdown'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()

  // Função para abrir o sidebar
  const openSidebar = () => {
    setSidebarOpen(true)
  }

  // Função para fechar o sidebar
  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Sidebar controlável */}
      <AppSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Header fixo no topo */}
      <header className={cn(
        "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm",
        "sticky top-0 z-40",
        className
      )}>
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo e menu button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center p-2 rounded-md",
                "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "transition-colors duration-200"
              )}
              onClick={openSidebar}
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="flex items-center gap-2">
              {/* Logo simples */}
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <h1 className={cn(
                "font-bold text-gray-900 dark:text-white",
                isMobile ? "text-lg" : "text-xl"
              )}>
                StayFocus
              </h1>
            </div>
          </div>

          {/* Controles do header */}
          <div className="flex items-center space-x-3">
            {/* Ícone de Sono */}
            <Link href="/sono">
              <button
                className={cn(
                  "p-2 rounded-full transition-colors duration-200",
                  "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300",
                  "hover:bg-purple-50 dark:hover:bg-purple-900/20",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500"
                )}
                aria-label="Gestão do Sono"
              >
                <Bed className="h-5 w-5" aria-hidden="true" />
              </button>
            </Link>
            
            {/* Ícone de Autoconhecimento */}
            <Link href="/autoconhecimento">
              <button
                className={cn(
                  "p-2 rounded-full transition-colors duration-200",
                  "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300",
                  "hover:bg-amber-50 dark:hover:bg-amber-900/20",
                  "focus:outline-none focus:ring-2 focus:ring-amber-500"
                )}
                aria-label="Notas de Autoconhecimento"
              >
                <Anchor className="h-5 w-5" aria-hidden="true" />
              </button>
            </Link>

            {/* Toggle de tema */}
            <ThemeToggle />

            {/* Help/Roadmap button */}
            <Link href="/roadmap">
              <button
                className={cn(
                  "p-2 rounded-full transition-colors duration-200",
                  "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                aria-label="Roadmap e Ajuda"
              >
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
              </button>
            </Link>

            {/* Dropdown de Autenticação */}
            <AuthenticationDropdown>
              <button
                className={cn(
                  "p-2 rounded-full transition-colors duration-200",
                  "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
                  "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                aria-label="Autenticação"
              >
                <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-current rounded-full" />
                </div>
              </button>
            </AuthenticationDropdown>

            {/* Dropdown de Conta de Usuário */}
            <UserAccountDropdown>
              <button 
                className={cn(
                  "h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700",
                  "text-white flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "transition-colors duration-200"
                )}
                aria-label="Configurações da Conta"
              >
                <span className="text-sm font-medium">U</span>
              </button>
            </UserAccountDropdown>
          </div>
        </div>
      </header>
    </>
  )
}