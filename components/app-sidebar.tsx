"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
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
} from "lucide-react"
import { NAVIGATION_ITEMS, SECONDARY_NAVIGATION_ITEMS } from "@/lib/constants"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()

  const getUserInitials = (email?: string) => {
    if (!email) return "U"
    return email.charAt(0).toUpperCase()
  }

  const getUserDisplayName = (email?: string) => {
    if (!email) return "Usuário"
    return email.split("@")[0]
  }

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar 
      className="border-r border-slate-700 bg-slate-800" 
      collapsible="icon"
      {...props}
    >
      <SidebarHeader className="border-b border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Zap className="size-5" />
          </div>
          <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
            <span className="truncate font-bold text-white text-lg">StayFocus</span>
            <span className="truncate text-xs text-slate-400">Organização Neurodivergente</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 py-2 group-data-[collapsible=icon]:hidden">
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {NAVIGATION_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url} 
                    tooltip={item.description}
                    className={`w-full justify-start px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-700 hover:text-white ${
                      pathname === item.url 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300'
                    }`}
                  >
                    <Link href={item.url} onClick={handleNavigation}>
                      <item.icon className="size-4 mr-3 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 py-2 group-data-[collapsible=icon]:hidden">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {SECONDARY_NAVIGATION_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url} 
                    tooltip={item.description}
                    className={`w-full justify-start px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-700 hover:text-white ${
                      pathname === item.url 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300'
                    }`}
                  >
                    <Link href={item.url} onClick={handleNavigation}>
                      <item.icon className="size-4 mr-3 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-700 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full p-3 hover:bg-slate-700 data-[state=open]:bg-slate-700">
                  <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                    <AvatarImage src="/placeholder.svg" alt={user?.email || "Usuário"} />
                    <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                      {getUserInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-3 group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-white">{getUserDisplayName(user?.email)}</span>
                    <span className="truncate text-xs text-slate-400">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-slate-400 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg bg-slate-800 border-slate-700"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700" onClick={handleNavigation}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem 
                  onClick={signOut} 
                  className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
