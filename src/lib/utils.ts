
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString();
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat().format(num);
}
