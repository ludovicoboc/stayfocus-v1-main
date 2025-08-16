"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { LucideIcon, Key, Bed, Anchor, HelpCircle, User } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AuthenticationDropdown } from './authentication-dropdown'
import { UserAccountDropdown } from './user-account-dropdown'
import { SidebarToggle } from './sidebar-toggle-old'
import { useIsMobile } from '@/hooks/use-mobile'

// TypeScript interfaces for header navigation items
interface HeaderNavigationItem {
  id: string
  icon: LucideIcon
  tooltip: string
  action: 'navigate' | 'dropdown'
  route?: string
  component?: React.ComponentType
}

interface AppHeaderProps {
  className?: string
}

// Header navigation configuration
const HEADER_NAVIGATION: HeaderNavigationItem[] = [
  {
    id: 'auth',
    icon: Key,
    tooltip: 'Autenticação',
    action: 'dropdown'
  },
  {
    id: 'sleep',
    icon: Bed,
    tooltip: 'Sono',
    action: 'navigate',
    route: '/sono'
  },
  {
    id: 'self-knowledge',
    icon: Anchor,
    tooltip: 'Autoconhecimento',
    action: 'navigate',
    route: '/autoconhecimento'
  },
  {
    id: 'roadmap',
    icon: HelpCircle,
    tooltip: 'Roadmap',
    action: 'navigate',
    route: '/roadmap'
  },
  {
    id: 'account',
    icon: User,
    tooltip: 'Configurações da Conta',
    action: 'dropdown'
  }
]

export function AppHeader({ className }: AppHeaderProps) {
  const router = useRouter()
  const isMobile = useIsMobile()

  const handleItemClick = (item: HeaderNavigationItem) => {
    if (item.action === 'navigate' && item.route) {
      router.push(item.route)
    }
    // Dropdown actions are handled by the dropdown components themselves
  }

  const renderNavigationItem = (item: HeaderNavigationItem) => {
    const IconComponent = item.icon
    
    const buttonElement = (
      <button
        onClick={() => handleItemClick(item)}
        className={`
          rounded-lg
          text-slate-300 hover:text-white
          hover:bg-slate-700 active:bg-slate-600
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
          touch-manipulation
          ${isMobile 
            ? 'p-3 min-w-[44px] min-h-[44px] flex items-center justify-center' 
            : 'p-2 sm:p-2.5 md:p-3 lg:p-3'
          }
        `}
        aria-label={item.tooltip}
        role="button"
        tabIndex={0}
      >
        <IconComponent className={`
          transition-transform duration-200 hover:scale-110
          ${isMobile 
            ? 'w-5 h-5' 
            : 'w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-6 lg:h-6'
          }
        `} />
      </button>
    )

    // Handle dropdown items
    if (item.action === 'dropdown') {
      if (item.id === 'auth') {
        return (
          <AuthenticationDropdown key={item.id}>
            {buttonElement}
          </AuthenticationDropdown>
        )
      } else if (item.id === 'account') {
        return (
          <UserAccountDropdown key={item.id}>
            {buttonElement}
          </UserAccountDropdown>
        )
      }
    }

    // Handle navigation items with tooltip (optimize for touch devices)
    if (isMobile) {
      // On mobile, use aria-label for accessibility instead of tooltips
      return React.cloneElement(buttonElement, { key: item.id })
    }

    return (
      <Tooltip key={item.id} delayDuration={300}>
        <TooltipTrigger asChild>
          {buttonElement}
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="center"
          className="text-sm bg-slate-700 text-white border-slate-600"
        >
          <p>{item.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <header className={`
      sticky top-0 z-[60]
      bg-slate-800/95 backdrop-blur-sm border-b border-slate-700
      flex items-center justify-between
      transition-all duration-200
      ${isMobile 
        ? 'h-16 px-3' 
        : 'h-14 px-4 sm:px-6 lg:px-8'
      }
      ${className || ''}
    `}>
      {/* Logo/Brand area with sidebar toggle */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarToggle />
        <h1 className={`
          text-white font-semibold truncate
          ${isMobile ? 'text-base' : 'text-lg xl:text-xl'}
        `}>
          StayFocus
        </h1>
      </div>

      {/* Navigation icons */}
      <nav className={`
        flex items-center flex-shrink-0
        ${isMobile 
          ? 'gap-1' 
          : 'gap-2 sm:gap-3 md:gap-4 lg:gap-5'
        }
      `}>
        <TooltipProvider delayDuration={isMobile ? 0 : 300}>
          {HEADER_NAVIGATION.map((item) => renderNavigationItem(item))}
        </TooltipProvider>
      </nav>
    </header>
  )
}

// Export types for use in other components
export type { HeaderNavigationItem, AppHeaderProps }
export { HEADER_NAVIGATION }
