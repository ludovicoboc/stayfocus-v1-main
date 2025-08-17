import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Retorna a data atual no formato YYYY-MM-DD (em UTC)
export function getCurrentDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// Desloca uma data por um número de dias (positivo ou negativo)
export function shiftDate(base: string, delta: number): string {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split("T")[0];
}
