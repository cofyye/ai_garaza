import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Users,
  Briefcase,
  MessageSquare,
  BarChart2,
  Settings,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { label: "Job Posts", icon: Briefcase, path: "/jobs", disabled: false },
  {
    label: "Applications",
    icon: Users,
    path: "/applications",
    disabled: false,
  },
  { label: "Analytics", icon: BarChart2, path: "/analytics", disabled: false },
  // Visually enabled (disabled: false) but path set to "#" so user cannot enter
  { label: "Interviews", icon: MessageSquare, path: "#", disabled: false },
  { label: "Settings", icon: Settings, path: "#", disabled: false },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden w-64 flex-col bg-transparent md:flex h-screen sticky top-0">
      <div className="flex h-20 items-center px-6">
        <Cpu className="mr-2 h-8 w-8 text-black" />
        <span className="text-xl font-bold text-black">Engval.ai</span>
      </div>

      <nav className="flex-1 space-y-2 px-4 mt-10">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.label}
              to={item.disabled ? "#" : item.path}
              className={cn(
                "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-black text-white shadow-lg shadow-gray-200"
                  : "text-gray-500 hover:bg-white hover:text-black hover:shadow-sm",
                item.disabled &&
                  "cursor-not-allowed opacity-50 hover:bg-transparent hover:shadow-none"
              )}
              onClick={(e) => item.path === "#" && e.preventDefault()}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-black"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <Link
          to="#"
          className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:bg-white hover:text-black hover:shadow-sm transition-all"
        >
          <HelpCircle className="mr-3 h-5 w-5 text-gray-400" />
          Help & Support
        </Link>
      </div>
    </aside>
  );
};
