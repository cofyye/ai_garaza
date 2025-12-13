import React from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  Users, 
  Briefcase, 
  MessageSquare, 
  BarChart2, 
  Settings, 
  HelpCircle, 
  Cpu 
} from "lucide-react";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { label: "Job Posts", icon: Briefcase, path: "/jobs", disabled: false },
  { label: "Clients", icon: Users, path: "/clients", disabled: false },
  { label: "Analytics", icon: BarChart2, path: "/analytics", disabled: false },
  // Visually enabled (disabled: false) but path set to "#" so user cannot enter
  { label: "Interviews", icon: MessageSquare, path: "#", disabled: false },
  { label: "Settings", icon: Settings, path: "#", disabled: false },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex h-screen sticky top-0">
      <div className="flex h-14 items-center border-b border-gray-200 px-6">
        <Cpu className="mr-2 h-6 w-6 text-indigo-600" />
        <span className="text-lg font-bold text-gray-900">TalentAI</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.label}
              to={item.disabled ? "#" : item.path}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                item.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
              )}
              onClick={(e) => item.path === "#" && e.preventDefault()}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <Link
          to="#"
          className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <HelpCircle className="mr-3 h-5 w-5 text-gray-400" />
          Help & Support
        </Link>
      </div>
    </aside>
  );
};