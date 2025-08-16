export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleSupabaseError(error: any): AppError {
  if (error?.code === 'PGRST116') {
    return new AppError('Dados não encontrados', 'NOT_FOUND', 404)
  }
  
  if (error?.code === '23505') {
    return new AppError('Dados duplicados', 'DUPLICATE_DATA', 409)
  }
  
  if (error?.message?.includes('JWT')) {
    return new AppError('Sessão expirada', 'UNAUTHORIZED', 401)
  }
  
  return new AppError(
    error?.message || 'Erro interno do servidor',
    'INTERNAL_ERROR',
    500
  )
}

export function logError(error: Error, context?: string) {
  console.error(`[${context || 'APP'}] ${error.name}: ${error.message}`, {
    stack: error.stack,
    timestamp: new Date().toISOString(),
  })
}