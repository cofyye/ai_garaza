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
  // Normalize status to lowercase for comparison
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    // Application statuses
    case "pending": return "bg-blue-50 text-blue-700 border-blue-200";
    case "invited": return "bg-purple-50 text-purple-700 border-purple-200";
    case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "reviewed": return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "accepted": return "bg-green-100 text-green-800 border-green-300";
    case "rejected": return "bg-red-50 text-red-700 border-red-200";

    // Job statuses
    case "active": return "bg-green-50 text-green-700 border-green-200";
    case "closed": return "bg-gray-100 text-gray-500 border-gray-200";
    case "draft": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    
    // Assignment statuses
    case "sent": return "bg-gray-100 text-gray-700 border-gray-200";
    case "submitted": return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "in_progress": return "bg-blue-50 text-blue-700 border-blue-200";
    
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}