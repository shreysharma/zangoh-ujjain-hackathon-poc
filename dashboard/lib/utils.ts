import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeInput(input: string): string {
  // Basic HTML sanitization - remove script tags and dangerous content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

export function validateInput(input: string, maxLength: number = 1000): { isValid: boolean; error?: string } {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: "Input cannot be empty" };
  }

  if (input.length > maxLength) {
    return { isValid: false, error: `Input cannot exceed ${maxLength} characters` };
  }

  return { isValid: true };
}
