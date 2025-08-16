"use client"

import { Zap } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">StayFocus</h2>
          <p className="text-slate-400">Carregando sua organização...</p>
        </div>
      </div>
    </div>
  )
}