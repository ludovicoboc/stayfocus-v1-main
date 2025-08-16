import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReceitasLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Skeleton className="flex-1 h-10 bg-slate-800" />
          <Skeleton className="w-full md:w-48 h-10 bg-slate-800" />
        </div>

        {/* Grid de Receitas Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Skeleton className="w-32 h-6 bg-slate-700" />
                  <Skeleton className="w-5 h-5 bg-slate-700" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-16 h-5 bg-slate-700" />
                  <Skeleton className="w-12 h-5 bg-slate-700" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-4 bg-slate-700" />
                  <Skeleton className="w-20 h-4 bg-slate-700" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="w-20 h-4 bg-slate-700" />
                  <div className="space-y-1">
                    <Skeleton className="w-full h-3 bg-slate-700" />
                    <Skeleton className="w-3/4 h-3 bg-slate-700" />
                    <Skeleton className="w-1/2 h-3 bg-slate-700" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Skeleton className="flex-1 h-9 bg-slate-700" />
                  <Skeleton className="w-9 h-9 bg-slate-700" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  )
}
