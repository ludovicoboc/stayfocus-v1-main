"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RegistroMedicamentos } from "@/components/registro-medicamentos";
import { MonitoramentoHumor } from "@/components/monitoramento-humor";
import { getCurrentDateString } from "@/lib/utils";

function SaudeContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<string>(
    getCurrentDateString(),
  );

  useEffect(() => {
    const dateFromQuery = searchParams.get("date");
    if (dateFromQuery) {
      setCurrentDate(dateFromQuery);
    }
  }, [searchParams]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", newDate);
    router.push(`/saude?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-white text-center text-xl font-bold mb-4">
              Login Necessário
            </div>
            <div className="text-slate-300 text-center mb-6">
              Você precisa estar logado para acessar esta página.
            </div>
            <Link href="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Fazer Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4">
      <RegistroMedicamentos date={currentDate} />
      <MonitoramentoHumor date={currentDate} />
      {/* Footer Quote */}
      <footer className="mt-12 text-center">
        <blockquote className="text-slate-400 italic text-sm">
          "Whaka te iti kahurangi, ki te tuohu koe, me he maunga teitei" -
          Provérbio da língua Māori
        </blockquote>
        <div className="text-slate-500 text-xs mt-1">
          Tradução: "Busque o tesouro que você mais valoriza, se você inclinar a
          cabeça, que seja para uma montanha elevada."
        </div>
        <div className="text-slate-600 text-xs mt-2">StayFocus Oficial</div>
      </footer>
    </main>
  );
}

export default function SaudePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SaudeContent />
    </Suspense>
  );
}
