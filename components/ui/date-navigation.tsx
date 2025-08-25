"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCurrentDateString } from "@/lib/utils";

interface DateNavigationProps {
  date?: string;
  onDateChangeAction: (date: string) => void;
  className?: string;
  showDatePicker?: boolean;
  title?: string;
}

export function DateNavigation({
  date,
  onDateChangeAction,
  className = "",
  showDatePicker = true,
  title,
}: DateNavigationProps) {
  const [currentDate, setCurrentDate] = useState<string>(
    date || getCurrentDateString(),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shiftDate = (base: string, delta: number) => {
    const d = new Date(base + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().split("T")[0];
  };

  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString + "T00:00:00Z");
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    if (date) {
      setCurrentDate(date);
    }
  }, [date]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    onDateChangeAction(newDate);
  };

  const handlePreviousDay = () => {
    const newDate = shiftDate(currentDate, -1);
    handleDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = shiftDate(currentDate, 1);
    handleDateChange(newDate);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) {
      handleDateChange(newDate);
    }
  };

  // Durante o pre-rendering, renderizar sem event handlers
  if (!mounted) {
    return (
      <div className={`flex items-center justify-between gap-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Ontem
          </Button>

          <div className="flex items-center gap-2">
            {title && (
              <span className="text-lg font-semibold text-white">{title} •</span>
            )}
            <span className="text-lg font-semibold text-white">
              {formatDisplayDate(currentDate)}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Amanhã
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {showDatePicker && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Input
              type="date"
              value={currentDate}
              className="bg-slate-800 border-slate-600 text-white w-40"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          onClick={handlePreviousDay}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Ontem
        </Button>

        <div className="flex items-center gap-2">
          {title && (
            <span className="text-lg font-semibold text-white">{title} •</span>
          )}
          <span className="text-lg font-semibold text-white">
            {formatDisplayDate(currentDate)}
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          onClick={handleNextDay}
        >
          Amanhã
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {showDatePicker && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Input
            type="date"
            value={currentDate}
            onChange={handleDateInputChange}
            className="bg-slate-800 border-slate-600 text-white w-40"
          />
        </div>
      )}
    </div>
  );
}
