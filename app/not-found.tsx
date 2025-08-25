"use client";

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</h1>
          <div className="relative -mt-16">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Página não encontrada
            </h2>
          </div>
        </div>
        
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Oops! A página que você está procurando não existe ou foi movida.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
          
          <Button variant="outline" onClick={handleGoBack} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Página anterior
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Precisa de ajuda? <Link href="/perfil/ajuda" className="underline hover:text-gray-700 dark:hover:text-gray-300">
              Centro de ajuda
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}