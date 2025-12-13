import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function getStatusColor(status: string) {
  // Normalize status to uppercase for comparison
  const normalizedStatus = status.toUpperCase();
  
  switch (normalizedStatus) {
    // Client statuses
    case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
    case "IN_PROGRESS": return "bg-blue-100 text-blue-700 border-blue-200";
    case "NOT_STARTED": return "bg-gray-100 text-gray-600 border-gray-200";
    case "EXPIRED": return "bg-red-50 text-red-600 border-red-200";
    
    // Legacy Job statuses (uppercase)
    case "OPEN": return "bg-green-100 text-green-700 border-green-200";
    case "CLOSED": return "bg-gray-100 text-gray-500 border-gray-200";
    
    // New Job statuses (from backend - lowercase mapped)
    case "ACTIVE": return "bg-green-100 text-green-700 border-green-200";
    case "DRAFT": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    
    // Verdict statuses
    case "STRONG_HIRE": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "HIRE": return "bg-blue-100 text-blue-800 border-blue-200";
    case "NO_HIRE": return "bg-orange-100 text-orange-800 border-orange-200";
    
    default: return "bg-gray-100 text-gray-700";
  }
}