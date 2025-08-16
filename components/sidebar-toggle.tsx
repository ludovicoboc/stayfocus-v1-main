"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

export function SidebarToggle() {
  const { toggleSidebar, open, openMobile } = useSidebar()
  const isMobile = useIsMobile()

  const isOpen = isMobile ? openMobile : open

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      aria-label={isOpen ? "Fechar sidebar" : "Abrir sidebar"}
    >
      {isOpen ? (
        <X className="h-4 w-4" />
      ) : (
        <Menu className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  )
}