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
    case "invited": return "bg-violet-50 text-violet-700 border-violet-200";
    case "completed": return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "reviewed": return "bg-amber-50 text-amber-700 border-amber-200";
    case "accepted": return "bg-teal-50 text-teal-700 border-teal-200";
    case "rejected": return "bg-rose-50 text-rose-700 border-rose-200";

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