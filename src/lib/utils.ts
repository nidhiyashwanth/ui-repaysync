import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

export function formatCurrency(
  amount: number | string | undefined | null
): string {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
}

export function formatPhoneNumber(
  phoneNumber: string | undefined | null
): string {
  if (!phoneNumber) return "-";

  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Format: (XXX) XXX-XXXX if US/Canada format
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }

  // Format international: +X XXX XXX XXXX
  if (cleaned.length > 10) {
    return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(
      -10,
      -7
    )} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
  }

  // Return as is if it doesn't match known formats
  return phoneNumber;
}

export function truncateText(
  text: string | undefined | null,
  maxLength: number
): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

export function getInitials(
  firstName: string | undefined | null,
  lastName: string | undefined | null
): string {
  if (!firstName && !lastName) return "";

  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";

  return (first + last).toUpperCase();
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
