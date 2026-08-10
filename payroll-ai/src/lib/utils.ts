// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatMonthYear(month: number, year: number): string {
  return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleDateString('en-IN', { month: 'short' });
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? 's' : ''}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    processed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    'weekly-off': 'bg-gray-100 text-gray-500',
    leave: 'bg-blue-100 text-blue-700',
  };
  return map[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
}
