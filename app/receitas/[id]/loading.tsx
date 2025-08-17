import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChefHat, Clock, Users } from "lucide-react";

export default function ReceitaLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header com navegação e ações */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-20 bg-slate-700 rounded animate-pulse" />

        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-slate-700 rounded animate-pulse" />
          <div className="h-8 w-16 bg-slate-700 rounded animate-pulse" />
          <div className="h-8 w-16 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Cartão principal da receita */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="space-y-4">
            {/* Título e badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ChefHat className="w-7 h-7 text-orange-500" />
                <div className="h-8 w-64 bg-slate-700 rounded animate-pulse" />
              </div>

              <div className="flex items-center gap-2">
                <div className="h-6 w-20 bg-slate-700 rounded animate-pulse" />
                <div className="h-6 w-16 bg-slate-700 rounded animate-pulse" />
              </div>
            </div>

            {/* Informações da receita */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
              </div>

              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-slate-400" />
                <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
              </div>

              <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Ingredientes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <div className="h-6 w-24 bg-slate-700 rounded animate-pulse" />
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-orange-500">•</span>
                  <div className="h-4 w-full max-w-xs bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Separador */}
          <div className="h-px bg-slate-700" />

          {/* Modo de preparo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">👨‍🍳</span>
              <div className="h-6 w-32 bg-slate-700 rounded animate-pulse" />
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações adicionais */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="h-6 w-16 bg-slate-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-10 bg-slate-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
